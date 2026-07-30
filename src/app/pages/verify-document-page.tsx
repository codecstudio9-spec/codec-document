import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Shield, ShieldCheck, ShieldX, Search, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';
import { LanguageToggle } from '../components/language-toggle';
import { SEOHead } from '../components/seo-head';
import { LandingFooter } from '../components/landing/LandingFooter';
import { SITE_URL } from '../config/site';
import { verifySignTransaction, type VerifiedTransaction } from '../services/sign-transaction-service';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS_LABEL: Record<string, { en: string; es: string }> = {
  completed:         { en: 'Signed and completed', es: 'Firmado y completado' },
  pending:           { en: 'Pending signature',    es: 'Pendiente de firma' },
  pending_recipient: { en: 'Pending signature',    es: 'Pendiente de firma' },
  sender_signed:     { en: 'Pending signature',    es: 'Pendiente de firma' },
  signing:           { en: 'Pending signature',    es: 'Pendiente de firma' },
  cancelled:         { en: 'Cancelled',             es: 'Cancelado' },
  expired:           { en: 'Expired',               es: 'Expirado' },
};

/**
 * Public "Verificador de Autenticidad" (/verificar) — anyone holding a
 * transaction id printed on a Codec Document audit page can confirm here
 * that it's real. Deliberately calls verify_sign_transaction (a narrow
 * RPC — status/type/dates only), never get_sign_transaction_public, which
 * would leak selfies/ID photos/IPs to this public, unauthenticated page.
 */
export function VerifyDocumentPage() {
  const { language } = useLanguage();
  const [params] = useSearchParams();
  const [input, setInput] = useState(params.get('id') ?? '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifiedTransaction | null>(null);
  const [searched, setSearched] = useState(false);

  const runVerify = async (raw: string) => {
    const id = raw.trim();
    if (!id) return;
    setLoading(true);
    setSearched(true);
    try {
      if (!UUID_RE.test(id)) {
        setResult({ found: false, status: null, document_type: null, completed_at: null, created_at: null });
      } else {
        setResult(await verifySignTransaction(id));
      }
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return d;
    }
  };

  const statusLabel = result?.status ? STATUS_LABEL[result.status]?.[language] ?? result.status : null;

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={language === 'en' ? 'Document Verifier — Codec Document' : 'Verificador de Autenticidad — Codec Document'}
        description={language === 'en'
          ? 'Verify that a document signed with Codec Document is authentic. Paste the transaction ID printed on the audit page to confirm.'
          : 'Verifica que un documento firmado con Codec Document sea auténtico. Pega el ID de transacción impreso en la página de auditoría para confirmarlo.'}
        canonicalUrl={`${SITE_URL}/verificar`}
      />

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500" />
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="group flex items-center gap-2.5">
              <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_2px_10px_rgba(79,70,229,0.35)]">
                <Shield className="size-5 text-white" />
                <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
              </div>
              <span translate="no" className="notranslate block text-base font-black tracking-tight text-slate-900">
                Codec <span className="text-indigo-600">Document</span>
              </span>
            </Link>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white py-16 sm:py-24">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="container relative mx-auto max-w-2xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_8px_24px_rgba(79,70,229,0.35)]"
          >
            <ShieldCheck className="size-7 text-white" />
          </motion.div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            {language === 'en' ? 'Document Authenticity Verifier' : 'Verificador de Autenticidad'}
          </h1>
          <p className="mt-3 text-base text-slate-500 sm:text-lg">
            {language === 'en'
              ? 'Paste the transaction ID printed on the audit page of any Codec Document document or signature to confirm it’s real.'
              : 'Pega el ID de transacción impreso en la página de auditoría de cualquier documento o firma de Codec Document para confirmar que es real.'}
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); runVerify(input); }}
            className="mt-8 flex flex-col gap-2.5 sm:flex-row"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={language === 'en' ? 'e.g. a1b2c3d4-e5f6-7890-abcd-ef1234567890' : 'ej. a1b2c3d4-e5f6-7890-abcd-ef1234567890'}
              className="w-full flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-[0_2px_10px_rgba(79,70,229,0.35)] transition-all hover:shadow-[0_4px_16px_rgba(79,70,229,0.5)] disabled:opacity-50"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              {language === 'en' ? 'Verify' : 'Verificar'}
            </button>
          </form>

          {searched && !loading && result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-8 rounded-2xl border p-6 text-left ${
                result.found ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'
              }`}
            >
              {result.found ? (
                <div>
                  <div className="flex items-center gap-2.5 text-emerald-700">
                    <ShieldCheck className="size-6 shrink-0" />
                    <p className="text-base font-bold">
                      {language === 'en' ? 'This document is authentic' : 'Este documento es auténtico'}
                    </p>
                  </div>
                  <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-emerald-700/70">{language === 'en' ? 'Status' : 'Estado'}</dt>
                      <dd className="text-emerald-900">{statusLabel}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-emerald-700/70">{language === 'en' ? 'Document type' : 'Tipo de documento'}</dt>
                      <dd className="text-emerald-900">{result.document_type ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-emerald-700/70">{language === 'en' ? 'Created' : 'Creado'}</dt>
                      <dd className="text-emerald-900">{fmtDate(result.created_at)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-emerald-700/70">{language === 'en' ? 'Completed' : 'Completado'}</dt>
                      <dd className="text-emerald-900">{fmtDate(result.completed_at)}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 text-rose-700">
                  <ShieldX className="size-6 shrink-0" />
                  <p className="text-sm font-bold">
                    {language === 'en'
                      ? 'No document found for that ID. Double-check the transaction ID and try again.'
                      : 'No se encontró ningún documento con ese ID. Verifica el ID de transacción e intenta de nuevo.'}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          <p className="mt-8 text-xs text-slate-400">
            {language === 'en'
              ? 'This tool only confirms existence, status and dates — never personal data, selfies, ID photos or signatures.'
              : 'Esta herramienta solo confirma existencia, estado y fechas — nunca datos personales, selfies, fotos de identificación o firmas.'}
          </p>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
