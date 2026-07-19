import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, Plus, Trash2, Loader, FileText, Send, Copy, CheckCheck,
  ChevronDown, ChevronUp, Eye, CreditCard, XCircle, RefreshCw,
} from 'lucide-react';
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';
import { SITE_URL } from '../config/site';
import { getPayPalClientId } from '../config/paypal';
import { verifyPaypalOrder } from '../../lib/paypal-verify';
import { detectSignerCountryCode } from '../../lib/geo';
import { getUserBranding } from '../services/branding-service';
import {
  createQuote, updateQuote, getMyQuoteFull, setQuotePdfAndStatus, linkQuoteSignature,
  computeQuoteTotals, computeLineItemTotal, getQuoteDocumentTitle,
  type QuoteLineItem, type ProposalBlocks, type QuoteType,
} from '../services/quotes-service';
import { consumeQuoteLimit72h, getNextQuoteSlot } from '../services/user-limits-service';
import { generateQuotePdf } from '../services/quote-pdf-generator';
import {
  createDocumentRecord, uploadPdfToStorage, updateDocumentPdfUrl, createSigner, createSigningLink,
} from '../../lib/signatureService';

const QUOTE_SINGLE_PRICE = 6.99;

/** Inline PayPal button for the $6.99 single-quote unlock — same split
 * as CompanyBillingButtons (my-company-page.tsx): lives inside
 * <PayPalScriptProvider> and reads real SDK load status via
 * usePayPalScriptReducer instead of a nonexistent onError prop on the
 * provider itself. */
function QuotePaywallButtons({ onApprove }: { onApprove: (orderId: string) => Promise<void> }) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  if (isRejected) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-center text-xs text-red-600">
        <XCircle className="size-5" />
        No se pudo cargar PayPal. Revisa tu conexión o desactiva bloqueadores de anuncios.
        <button type="button" onClick={() => window.location.reload()} className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-700 shadow-sm">
          <RefreshCw className="size-3.5" /> Reintentar
        </button>
      </div>
    );
  }
  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-white py-4 text-sm text-slate-500">
        <Loader className="size-4 animate-spin" /> Cargando PayPal…
      </div>
    );
  }

  return (
    <PayPalButtons
      style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay', height: 45, tagline: false }}
      createOrder={(_data, actions) =>
        actions.order.create({
          intent: 'CAPTURE',
          purchase_units: [{ description: 'Codec Document · Cotización Individual', amount: { currency_code: 'USD', value: QUOTE_SINGLE_PRICE.toFixed(2) } }],
          application_context: { brand_name: 'Codec Document', shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW' },
        })
      }
      onApprove={async (data, actions) => {
        const order = await actions.order!.capture();
        await onApprove(order.id || data.orderID || '');
      }}
      onCancel={() => toast.info('Pago cancelado. Puedes intentarlo de nuevo.')}
      onError={() => toast.error('Error con PayPal. Intenta de nuevo.')}
    />
  );
}

const EMPTY_ITEM: QuoteLineItem = { description: '', quantity: 1, unit: '', unit_price: 0, discount_pct: 0, tax_pct: 0 };

type QuoteTemplate = 'corporate' | 'modern' | 'executive' | 'minimal';

const TEMPLATES: Array<{ id: QuoteTemplate; es: string; en: string; descEs: string; descEn: string; swatch: string }> = [
  { id: 'corporate', es: 'Corporate', en: 'Corporate', descEs: 'Barra de color, clásico', descEn: 'Color bar, classic', swatch: '#4338CA' },
  { id: 'modern', es: 'Modern', en: 'Modern', descEs: 'Panel de color, audaz', descEn: 'Color panel, bold', swatch: '#2563EB' },
  { id: 'executive', es: 'Executive', en: 'Executive', descEs: 'Serif centrado, formal', descEn: 'Centered serif, formal', swatch: '#334155' },
  { id: 'minimal', es: 'Minimal', en: 'Minimal', descEs: 'Blanco y negro, limpio', descEn: 'Black & white, clean', swatch: '#0F172A' },
];

const BLOCK_KEYS: Array<{ key: keyof ProposalBlocks; es: string; en: string }> = [
  { key: 'intro', es: 'Introducción', en: 'Introduction' },
  { key: 'problem', es: 'Problema del Cliente', en: 'Client Problem' },
  { key: 'solution', es: 'Solución Propuesta', en: 'Proposed Solution' },
  { key: 'benefits', es: 'Beneficios', en: 'Benefits' },
  { key: 'exclusions', es: 'Exclusiones', en: 'Exclusions' },
  { key: 'timeline', es: 'Cronograma', en: 'Timeline' },
  { key: 'terms', es: 'Condiciones', en: 'Terms' },
  { key: 'warranty', es: 'Garantías', en: 'Warranty' },
  { key: 'payment_terms', es: 'Forma de Pago', en: 'Payment Terms' },
  { key: 'notes', es: 'Observaciones', en: 'Notes' },
];

const inputClass = 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400';
const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600';

export function MyQuoteEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const { user, isAdmin, unlimitedActive, subscriptionActive } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [requestingSignature, setRequestingSignature] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [payingForQuote, setPayingForQuote] = useState(false);
  const [nextFreeSlot, setNextFreeSlot] = useState<Date | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(id ?? null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [quoteType, setQuoteType] = useState<QuoteType>('quote');
  const [template, setTemplate] = useState<QuoteTemplate>('corporate');

  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientPosition, setClientPosition] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  const [projectName, setProjectName] = useState('');
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [projectObjective, setProjectObjective] = useState('');
  const [projectScope, setProjectScope] = useState('');

  const [items, setItems] = useState<QuoteLineItem[]>([{ ...EMPTY_ITEM }]);
  const [blocks, setBlocks] = useState<ProposalBlocks>({});
  const [openBlocks, setOpenBlocks] = useState<Set<string>>(new Set());

  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      detectSignerCountryCode().then(setCountryCode).catch(() => {});
      return;
    }
    getMyQuoteFull(id!).then((full) => {
      if (!full) { toast.error(language === 'en' ? 'Quote not found.' : 'Cotización no encontrada.'); navigate('/my-quotes'); return; }
      const { quote, items: loadedItems } = full;
      setQuoteId(quote.id);
      setCountryCode(quote.country);
      setQuoteType(quote.quote_type);
      setTemplate((quote.template as QuoteTemplate) || 'corporate');
      setClientName(quote.client_name); setClientCompany(quote.client_company ?? '');
      setClientPosition(quote.client_position ?? ''); setClientEmail(quote.client_email ?? '');
      setClientPhone(quote.client_phone ?? ''); setClientAddress(quote.client_address ?? '');
      setProjectName(quote.project_name ?? ''); setExecutiveSummary(quote.executive_summary ?? '');
      setProjectObjective(quote.project_objective ?? ''); setProjectScope(quote.project_scope ?? '');
      setItems(loadedItems.length > 0 ? loadedItems : [{ ...EMPTY_ITEM }]);
      setBlocks(quote.proposal_blocks ?? {});
      setLoading(false);
    }).catch(() => { toast.error(language === 'en' ? 'Could not load the quote.' : 'No se pudo cargar la cotización.'); navigate('/my-quotes'); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const totals = computeQuoteTotals(items);
  const documentTitle = getQuoteDocumentTitle(countryCode, quoteType, language);

  const updateItem = (index: number, patch: Partial<QuoteLineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };
  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (index: number) => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  const toggleBlock = (key: string) => {
    setOpenBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const buildQuoteInput = () => ({
    country: countryCode, language: (language === 'en' ? 'en' : 'es') as 'en' | 'es', quote_type: quoteType,
    client_name: clientName, client_company: clientCompany, client_position: clientPosition,
    client_email: clientEmail, client_phone: clientPhone, client_address: clientAddress,
    project_name: projectName, executive_summary: executiveSummary, project_objective: projectObjective,
    project_scope: projectScope, proposal_blocks: blocks,
    subtotal: totals.subtotal, discount_total: totals.discountTotal, tax_total: totals.taxTotal, total: totals.total,
    template,
  });

  /** Actually inserts the quote row — called either directly (free slot
   * available) or after a successful $6.99 PayPal capture. */
  const finalizeNewQuote = async (): Promise<string> => {
    const newId = await createQuote(buildQuoteInput(), items);
    setQuoteId(newId);
    setQuotaExceeded(false);
    navigate(`/my-quotes/${newId}`, { replace: true });
    toast.success(language === 'en' ? 'Quote created.' : 'Cotización creada.');
    return newId;
  };

  /** PayPal onApprove for the $6.99 single-quote unlock — verifies server-side
   * (paypal-verify, product 'quote_single') exactly like every other payment
   * in this app, then creates the quote the free-tier gate had just blocked. */
  const handlePaidQuoteApprove = async (orderId: string) => {
    setPayingForQuote(true);
    try {
      await verifyPaypalOrder({ orderId, product: 'quote_single' });
      await finalizeNewQuote();
      toast.success(language === 'en' ? 'Payment confirmed — quote created!' : '¡Pago confirmado — cotización creada!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Payment could not be verified.' : 'No se pudo verificar el pago.'));
    } finally {
      setPayingForQuote(false);
    }
  };

  const handleSave = async (): Promise<string | null> => {
    if (!clientName.trim()) {
      toast.error(language === 'en' ? 'Client name is required.' : 'El nombre del cliente es obligatorio.');
      return null;
    }
    setSaving(true);
    try {
      if (quoteId) {
        await updateQuote(quoteId, buildQuoteInput(), items);
        toast.success(language === 'en' ? 'Quote saved.' : 'Cotización guardada.');
        return quoteId;
      }

      // Free-tier gate: 2 NEW quotes / 72h, same independent-counter pattern
      // as documents and signatures — only consumed when a quote is
      // genuinely created, never on later edits to the same draft.
      const isPremium = Boolean(isAdmin || unlimitedActive || subscriptionActive);
      if (!isPremium && user?.id) {
        const { allowed } = await consumeQuoteLimit72h(user.id, false);
        if (!allowed) {
          setQuotaExceeded(true);
          getNextQuoteSlot(user.id).then(setNextFreeSlot).catch(() => {});
          return null;
        }
      }

      return await finalizeNewQuote();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not save the quote.' : 'No se pudo guardar la cotización.'));
      return null;
    } finally {
      setSaving(false);
    }
  };

  /** Client-side only — generates the PDF with the currently selected
   * template and opens it in a new tab. No save, no upload, so switching
   * templates to compare them costs nothing. */
  const handlePreview = async () => {
    if (!clientName.trim()) {
      toast.error(language === 'en' ? 'Add a client name to preview.' : 'Agrega un nombre de cliente para previsualizar.');
      return;
    }
    setPreviewing(true);
    try {
      const branding = user?.id ? await getUserBranding(user.id) : null;
      const draftQuote = {
        id: quoteId ?? 'preview', user_id: user?.id ?? '', quote_number: 'PREVIEW',
        status: 'draft' as const, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        pdf_url: null, signed: false, signature_transaction_id: null,
        ...buildQuoteInput(),
      };
      const pdfBytes = await generateQuotePdf(
        draftQuote as Parameters<typeof generateQuotePdf>[0], items,
        branding ? {
          company_logo_url: branding.companyLogoUrl, company_legal_name: branding.companyLegalName,
          company_address_line1: branding.companyAddressLine1, company_address_line2: branding.companyAddressLine2,
          company_city: branding.companyCity, company_state: branding.companyState, company_country: branding.companyCountry,
          company_phone: branding.companyPhone, company_email: branding.companyEmail, company_website: branding.companyWebsite,
          brand_color_primary: branding.brandColorPrimary, brand_color_secondary: branding.brandColorSecondary, brand_font: branding.brandFont,
          bank_name: branding.bankName, bank_account: branding.bankAccount, payment_ach: branding.paymentAch,
          payment_zelle: branding.paymentZelle, payment_nequi: branding.paymentNequi, payment_daviplata: branding.paymentDaviplata,
          payment_paypal: branding.paymentPaypal,
        } : null,
        documentTitle,
      );
      const blobUrl = URL.createObjectURL(new Blob([pdfBytes as BlobPart], { type: 'application/pdf' }));
      window.open(blobUrl, '_blank');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not generate preview.' : 'No se pudo generar la vista previa.'));
    } finally {
      setPreviewing(false);
    }
  };

  const handleRequestSignature = async () => {
    if (!clientEmail.trim()) {
      toast.error(language === 'en' ? 'Client email is required to request a signature.' : 'El correo del cliente es obligatorio para solicitar firma.');
      return;
    }
    const savedId = await handleSave();
    if (!savedId) return;

    setRequestingSignature(true);
    try {
      const full = await getMyQuoteFull(savedId);
      if (!full) throw new Error('Quote not found after save');
      const branding = user?.id ? await getUserBranding(user.id) : null;

      const pdfBytes = await generateQuotePdf(
        full.quote, full.items,
        branding ? {
          company_logo_url: branding.companyLogoUrl, company_legal_name: branding.companyLegalName,
          company_address_line1: branding.companyAddressLine1, company_address_line2: branding.companyAddressLine2,
          company_city: branding.companyCity, company_state: branding.companyState, company_country: branding.companyCountry,
          company_phone: branding.companyPhone, company_email: branding.companyEmail, company_website: branding.companyWebsite,
          brand_color_primary: branding.brandColorPrimary, brand_color_secondary: branding.brandColorSecondary, brand_font: branding.brandFont,
          bank_name: branding.bankName, bank_account: branding.bankAccount, payment_ach: branding.paymentAch,
          payment_zelle: branding.paymentZelle, payment_nequi: branding.paymentNequi, payment_daviplata: branding.paymentDaviplata,
          payment_paypal: branding.paymentPaypal,
        } : null,
        documentTitle,
      );
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

      const documentId = await createDocumentRecord({ name: projectName || full.quote.quote_number, userId: user?.id ?? null });
      const pdfUrl = await uploadPdfToStorage(documentId, pdfBlob);
      await updateDocumentPdfUrl(documentId, pdfUrl);
      const signerId = await createSigner({ documentId, name: clientName, email: clientEmail });
      const token = await createSigningLink({ documentId, signerId, guestName: clientName, guestEmail: clientEmail });
      await linkQuoteSignature(savedId, documentId);
      await setQuotePdfAndStatus(savedId, pdfUrl, 'sent');

      setShareLink(`${SITE_URL}/guest-sign/${token}`);
      toast.success(language === 'en' ? 'Signature request created!' : '¡Solicitud de firma creada!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not request the signature.' : 'No se pudo solicitar la firma.'));
    } finally {
      setRequestingSignature(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader className="size-6 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-3xl">
        <button type="button" onClick={() => navigate('/my-quotes')} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700">
          <ArrowLeft className="size-4" />
          {language === 'en' ? 'Back to Smart Quotes' : 'Volver a Cotizaciones Inteligentes'}
        </button>

        <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
          <FileText className="size-6 text-indigo-600" />
          {documentTitle}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {language === 'en'
            ? 'Create, send, and get this quote signed — a full agreement, not just a PDF.'
            : 'Crea, envía y logra que firmen esta cotización — un acuerdo completo, no solo un PDF.'}
        </p>

        {shareLink && (
          <div className="mt-5 rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
            <p className="mb-2 text-xs font-bold text-emerald-800">
              {language === 'en' ? 'Share this link with your client to review and sign:' : 'Comparte este link con tu cliente para revisar y firmar:'}
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg bg-white px-3 py-2 text-xs text-slate-700">{shareLink}</code>
              <button type="button" onClick={() => void handleCopyLink()} className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">
                {copied ? <CheckCheck className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? (language === 'en' ? 'Copied' : 'Copiado') : (language === 'en' ? 'Copy' : 'Copiar')}
              </button>
            </div>
          </div>
        )}

        {/* Template picker */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-bold text-slate-800">{language === 'en' ? 'PDF Template' : 'Plantilla del PDF'}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplate(t.id)}
                className={`rounded-2xl border-2 p-3 text-left transition ${template === t.id ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 bg-white'}`}
              >
                <div className="mb-2 h-10 w-full rounded-lg" style={{ background: t.swatch }} />
                <p className="text-xs font-bold text-slate-800">{language === 'en' ? t.en : t.es}</p>
                <p className="text-[10px] text-slate-400">{language === 'en' ? t.descEn : t.descEs}</p>
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={previewing}
            onClick={() => void handlePreview()}
            className="mt-4 flex items-center gap-1.5 text-xs font-bold text-indigo-600 disabled:opacity-50"
          >
            {previewing ? <Loader className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
            {language === 'en' ? 'Preview this template' : 'Previsualizar esta plantilla'}
          </button>
        </div>

        {/* Client data */}
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-bold text-slate-800">{language === 'en' ? 'Client' : 'Datos del Cliente'}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={labelClass}>{language === 'en' ? 'Name *' : 'Nombre *'}</label><input value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>{language === 'en' ? 'Company' : 'Empresa'}</label><input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>{language === 'en' ? 'Role' : 'Cargo'}</label><input value={clientPosition} onChange={(e) => setClientPosition(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>{language === 'en' ? 'Email' : 'Correo'}</label><input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>{language === 'en' ? 'Phone' : 'Teléfono'}</label><input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>{language === 'en' ? 'Address' : 'Dirección'}</label><input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className={inputClass} /></div>
          </div>
        </div>

        {/* Project data */}
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-bold text-slate-800">{language === 'en' ? 'Project' : 'Datos del Proyecto'}</p>
          <label className={labelClass}>{language === 'en' ? 'Project name' : 'Nombre del proyecto'}</label>
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)} className={`${inputClass} mb-3`} />
          <label className={labelClass}>{language === 'en' ? 'Executive summary' : 'Resumen ejecutivo'}</label>
          <textarea value={executiveSummary} onChange={(e) => setExecutiveSummary(e.target.value)} rows={2} className={`${inputClass} mb-3`} />
          <label className={labelClass}>{language === 'en' ? 'Objective' : 'Objetivo'}</label>
          <textarea value={projectObjective} onChange={(e) => setProjectObjective(e.target.value)} rows={2} className={`${inputClass} mb-3`} />
          <label className={labelClass}>{language === 'en' ? 'Scope' : 'Alcance'}</label>
          <textarea value={projectScope} onChange={(e) => setProjectScope(e.target.value)} rows={2} className={inputClass} />
        </div>

        {/* Line items */}
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-bold text-slate-800">{language === 'en' ? 'Products & Services' : 'Productos y Servicios'}</p>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                    placeholder={language === 'en' ? 'Description' : 'Descripción'}
                    className={`${inputClass} bg-white`}
                  />
                  <button type="button" onClick={() => removeItem(i)} className="shrink-0 text-slate-300 hover:text-red-500"><Trash2 className="size-4" /></button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <input type="number" min={0} value={item.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} placeholder={language === 'en' ? 'Qty' : 'Cant.'} className={`${inputClass} bg-white text-xs`} />
                  <input value={item.unit} onChange={(e) => updateItem(i, { unit: e.target.value })} placeholder={language === 'en' ? 'Unit' : 'Unidad'} className={`${inputClass} bg-white text-xs`} />
                  <input type="number" min={0} value={item.unit_price} onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })} placeholder={language === 'en' ? 'Price' : 'Precio'} className={`${inputClass} bg-white text-xs`} />
                  <input type="number" min={0} max={100} value={item.discount_pct} onChange={(e) => updateItem(i, { discount_pct: Number(e.target.value) })} placeholder="% Desc." className={`${inputClass} bg-white text-xs`} />
                  <input type="number" min={0} max={100} value={item.tax_pct} onChange={(e) => updateItem(i, { tax_pct: Number(e.target.value) })} placeholder="% Tax" className={`${inputClass} bg-white text-xs`} />
                </div>
                <p className="mt-1.5 text-right text-xs font-bold text-slate-500">{`$${computeLineItemTotal(item).toFixed(2)}`}</p>
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem} className="mt-3 flex items-center gap-1.5 text-xs font-bold text-indigo-600">
            <Plus className="size-3.5" /> {language === 'en' ? 'Add item' : 'Agregar producto'}
          </button>

          <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-right text-sm">
            <p className="text-slate-500">{language === 'en' ? 'Subtotal' : 'Subtotal'}: <b className="text-slate-800">${totals.subtotal.toFixed(2)}</b></p>
            {totals.discountTotal > 0 && <p className="text-slate-500">{language === 'en' ? 'Discount' : 'Descuento'}: <b className="text-slate-800">-${totals.discountTotal.toFixed(2)}</b></p>}
            {totals.taxTotal > 0 && <p className="text-slate-500">{language === 'en' ? 'Taxes' : 'Impuestos'}: <b className="text-slate-800">${totals.taxTotal.toFixed(2)}</b></p>}
            <p className="text-lg font-black text-indigo-700">{language === 'en' ? 'Total' : 'Total'}: ${totals.total.toFixed(2)}</p>
          </div>
        </div>

        {/* Proposal blocks */}
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-1 text-sm font-bold text-slate-800">{language === 'en' ? 'Commercial Proposal' : 'Propuesta Comercial'}</p>
          <p className="mb-4 text-xs text-slate-400">{language === 'en' ? 'Optional sections — activate what you need.' : 'Secciones opcionales — activa las que necesites.'}</p>
          <div className="space-y-2">
            {BLOCK_KEYS.map(({ key, es, en }) => (
              <div key={key} className="rounded-xl border border-slate-100">
                <button type="button" onClick={() => toggleBlock(key)} className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm font-semibold text-slate-700">
                  {language === 'en' ? en : es}
                  {openBlocks.has(key) ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
                </button>
                {openBlocks.has(key) && (
                  <textarea
                    value={blocks[key] ?? ''}
                    onChange={(e) => setBlocks((prev) => ({ ...prev, [key]: e.target.value }))}
                    rows={3}
                    className="w-full border-t border-slate-100 px-3.5 py-2.5 text-sm outline-none"
                    placeholder={language === 'en' ? en : es}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-800 px-6 py-3.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? <Loader className="size-4 animate-spin" /> : <FileText className="size-4" />}
            {language === 'en' ? 'Save draft' : 'Guardar borrador'}
          </button>
          <button
            type="button"
            disabled={requestingSignature}
            onClick={() => void handleRequestSignature()}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg disabled:opacity-50"
          >
            {requestingSignature ? <Loader className="size-4 animate-spin" /> : <Send className="size-4" />}
            {language === 'en' ? 'Request signature' : 'Solicitar firma'}
          </button>
        </div>

        {quotaExceeded && (
          <div className="mt-4 rounded-3xl border-2 border-amber-200 bg-amber-50 p-6">
            <p className="mb-1 flex items-center gap-2 text-sm font-bold text-amber-900">
              <CreditCard className="size-4" />
              {language === 'en' ? 'Free quotes used for this 72h window' : 'Cotizaciones gratis usadas en esta ventana de 72h'}
            </p>
            <p className="mb-4 text-xs text-amber-700">
              {nextFreeSlot
                ? (language === 'en'
                  ? `Next free slot: ${nextFreeSlot.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}. Or unlock this quote right now for $${QUOTE_SINGLE_PRICE.toFixed(2)}, or subscribe to the $29.99/mo plan for unlimited quotes.`
                  : `Próximo cupo libre: ${nextFreeSlot.toLocaleString('es-ES', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}. O desbloquea esta cotización ahora mismo por $${QUOTE_SINGLE_PRICE.toFixed(2)}, o mejora al plan de $29.99/mes para cotizaciones ilimitadas.`)
                : (language === 'en'
                  ? `Unlock this quote right now for $${QUOTE_SINGLE_PRICE.toFixed(2)}, or subscribe to the $29.99/mo plan for unlimited quotes.`
                  : `Desbloquea esta cotización ahora mismo por $${QUOTE_SINGLE_PRICE.toFixed(2)}, o mejora al plan de $29.99/mes para cotizaciones ilimitadas.`)}
            </p>

            {payingForQuote ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-white py-4 text-sm text-slate-600">
                <Loader className="size-4 animate-spin" />
                {language === 'en' ? 'Confirming payment…' : 'Confirmando pago…'}
              </div>
            ) : getPayPalClientId() ? (
              <PayPalScriptProvider options={{ clientId: getPayPalClientId(), currency: 'USD', intent: 'capture', components: 'buttons' }}>
                <QuotePaywallButtons onApprove={handlePaidQuoteApprove} />
              </PayPalScriptProvider>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                <XCircle className="size-4 shrink-0" />
                PayPal no configurado.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
