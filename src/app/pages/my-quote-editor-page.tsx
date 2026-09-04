import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, Plus, Trash2, Loader, FileText, Send, Copy, CheckCheck,
  ChevronDown, ChevronUp, Eye, CreditCard, XCircle, RefreshCw, Activity, Globe2, PenLine,
  Palette, SlidersHorizontal, Check, MessageCircle, Mail, Download,
} from 'lucide-react';
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';
import { SITE_URL } from '../config/site';
import { getPayPalClientId } from '../config/paypal';
import { verifyPaypalOrder, redeemPromoCode, consultarDescuento, type DescuentoDeBono } from '../../lib/paypal-verify';
import { detectSignerCountryCode } from '../../lib/geo';
import { getUserBranding } from '../services/branding-service';
import {
  createQuote, updateQuote, getMyQuoteFull, setQuotePdfAndStatus, linkQuoteSignature,
  computeQuoteTotals, computeLineItemTotal, getQuoteDocumentTitle, getQuoteViewStats, formatRelativeTime,
  type QuoteLineItem, type ProposalBlocks, type QuoteType, type QuoteStatus,
} from '../services/quotes-service';
import { consumeQuoteLimit72h, getNextQuoteSlot } from '../services/user-limits-service';
import { generateQuotePdf, parseTemplate, buildTemplateValue, type TemplateId } from '../services/quote-pdf-generator';
import { DictadoYMejora } from '../components/DictadoYMejora';
import { PropuestaComercial } from '../components/PropuestaComercial';
import { useGuiaFormulario } from '../hooks/use-guia-formulario';
import {
  createDocumentRecord, uploadPdfToStorage, updateDocumentPdfUrl, createSigner, createSigningLink,
  uploadSignatureImage, insertSignature, dataUrlToBlob, sha256Hex, getPublicIp,
} from '../../lib/signatureService';
import { SignatureModal } from '../components/signatures/SignatureModal';

const QUOTE_SINGLE_PRICE = 6.99;

/** Inline PayPal button for the $6.99 single-quote unlock — same split
 * as CompanyBillingButtons (my-company-page.tsx): lives inside
 * <PayPalScriptProvider> and reads real SDK load status via
 * usePayPalScriptReducer instead of a nonexistent onError prop on the
 * provider itself. */
function QuotePaywallButtons({ onApprove, descuento }: {
  onApprove: (orderId: string) => Promise<void>;
  descuento?: DescuentoDeBono | null;
}) {
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
          purchase_units: [{
            description: 'Codec Document · Cotización Individual',
            amount: {
              currency_code: 'USD',
              // Misma fórmula y mismo redondeo que el servidor al verificar:
              // un céntimo de diferencia y el pago se rechaza.
              value: (descuento
                ? Math.round(QUOTE_SINGLE_PRICE * (100 - descuento.discountPct)) / 100
                : QUOTE_SINGLE_PRICE).toFixed(2),
            },
          }],
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

type QuoteTemplate = TemplateId;

const TEMPLATES: Array<{ id: QuoteTemplate; es: string; en: string; descEs: string; descEn: string; swatch: string }> = [
  { id: 'corporate', es: 'Corporate', en: 'Corporate', descEs: 'Barra de color, clásico', descEn: 'Color bar, classic', swatch: '#4338CA' },
  { id: 'modern', es: 'Modern', en: 'Modern', descEs: 'Panel de color, audaz', descEn: 'Color panel, bold', swatch: '#2563EB' },
  { id: 'executive', es: 'Executive', en: 'Executive', descEs: 'Serif centrado, formal', descEn: 'Centered serif, formal', swatch: '#334155' },
  { id: 'minimal', es: 'Minimal', en: 'Minimal', descEs: 'Blanco y negro, limpio', descEn: 'Black & white, clean', swatch: '#0F172A' },
];

/**
 * Paleta del cajón de diseño.
 *
 * Va plegada a propósito. La mayoría de la gente quiere mandar la cotización,
 * no elegir un color; quien sí quiere, lo encuentra. Dieciséis tonos puestos
 * a la vista convierten una pantalla de trabajo en un catálogo.
 *
 * Sin elección, manda el color de marca que el cliente guardó en
 * Configuración — que sigue siendo la respuesta correcta por defecto.
 */
const COLORES: Array<{ hex: string; es: string; en: string }> = [
  { hex: '#4338CA', es: 'Índigo', en: 'Indigo' },
  { hex: '#1D4ED8', es: 'Azul', en: 'Blue' },
  { hex: '#0369A1', es: 'Azul acero', en: 'Steel blue' },
  { hex: '#0E7490', es: 'Cian profundo', en: 'Deep cyan' },
  { hex: '#0F766E', es: 'Verde azulado', en: 'Teal' },
  { hex: '#15803D', es: 'Verde', en: 'Green' },
  { hex: '#4D7C0F', es: 'Oliva', en: 'Olive' },
  { hex: '#A16207', es: 'Ámbar oscuro', en: 'Dark amber' },
  { hex: '#C2410C', es: 'Naranja quemado', en: 'Burnt orange' },
  { hex: '#B91C1C', es: 'Rojo', en: 'Red' },
  { hex: '#9F1239', es: 'Carmesí', en: 'Crimson' },
  { hex: '#A21CAF', es: 'Fucsia', en: 'Fuchsia' },
  { hex: '#7E22CE', es: 'Púrpura', en: 'Purple' },
  { hex: '#5B21B6', es: 'Violeta', en: 'Violet' },
  { hex: '#334155', es: 'Pizarra', en: 'Slate' },
  { hex: '#0F172A', es: 'Negro azulado', en: 'Near black' },
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

/** Bloques que son condiciones del contrato y no texto comercial. La IA los
 *  pule con tono de cláusula; el resto —introducción, problema, solución,
 *  beneficios— se corrige manteniendo la voz de quien escribe, porque una
 *  propuesta que suena a contrato no vende. */
const CLAUSULAS_DE_PROPUESTA = new Set(['exclusions', 'terms', 'warranty', 'payment_terms']);

/**
 * Traduce el perfil de marca al formato que espera el generador de PDF.
 *
 * Estaba escrito dos veces —en la vista previa y al pedir la firma— con la
 * misma lista de campos copiada a mano, así que añadir uno nuevo obligaba a
 * acordarse de los dos sitios. Faltaban justamente los que el cliente
 * configura y no salían: tamaño y posición del logo, marca de agua, y los
 * textos de cabecera y pie.
 */
type Branding = Awaited<ReturnType<typeof getUserBranding>>;
const aBrandingDePdf = (b: Branding | null) => (b ? {
  company_logo_url: b.companyLogoUrl, company_legal_name: b.companyLegalName,
  company_address_line1: b.companyAddressLine1, company_address_line2: b.companyAddressLine2,
  company_city: b.companyCity, company_state: b.companyState, company_country: b.companyCountry,
  company_phone: b.companyPhone, company_email: b.companyEmail, company_website: b.companyWebsite,
  brand_color_primary: b.brandColorPrimary, brand_color_secondary: b.brandColorSecondary, brand_font: b.brandFont,
  bank_name: b.bankName, bank_account: b.bankAccount, payment_ach: b.paymentAch,
  payment_zelle: b.paymentZelle, payment_nequi: b.paymentNequi, payment_daviplata: b.paymentDaviplata,
  payment_paypal: b.paymentPaypal,
  logo_size: b.logoSize, logo_position: b.logoPosition,
  enable_logo_in_docs: b.enableLogoInDocs, use_watermark: b.useWatermark,
  header_text: b.headerText, footer_text: b.footerText,
} : null);

const inputClass = 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400';
const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-600';

export function MyQuoteEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const { user, isAdmin, unlimitedActive, subscriptionActive } = useAuth();

  const { language } = useLanguage();

  // Guía por voz: presenta la cotización, dice cuántos bloques tiene y cuenta
  // que los textos largos se pueden dictar. Cada sección se narra al llegar.
  const seccionesDeVoz = useMemo(() => ({
    items: {
      es: 'Productos y servicios. Pon cada cosa con su cantidad y su precio, y de las cuentas me encargo yo: el descuento, el impuesto y el total se van calculando solos mientras escribes.',
      en: 'Products and services. Add each item with its quantity and price, and leave the maths to me: discount, tax and total work themselves out as you type.',
    },
    propuesta: {
      es: 'Aquí va el cuerpo de tu cotización, y tienes dos opciones. Pegas el texto en el recuadro y eso es exactamente lo que va a quedar. O te vas a la pestaña de al lado, me hablas por el micrófono, me dices algo como «hazme una cotización de treinta agendas a treinta mil cada una», y yo te escribo el texto completo y de paso te dejo los productos puestos aquí abajo. Tú decides, y lo que yo escriba lo puedes cambiar entero.',
      en: 'This is the body of your quote, and you have two options. Paste your text in the box and that is exactly what comes out. Or switch to the other tab, talk to me through the microphone — something like "write me a quote for thirty planners at thirty thousand each" — and I will write the whole text and fill in the products below. Your call, and you can change anything I write.',
    },
  }), []);

  useGuiaFormulario({
    nombreDocumento: language === 'en' ? 'a quote' : 'una cotización',
    cuantosCampos: 0,
    tienePremium: Boolean(isAdmin || unlimitedActive || subscriptionActive),
    secciones: seccionesDeVoz,
  });
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [requestingSignature, setRequestingSignature] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [payingForQuote, setPayingForQuote] = useState(false);
  const [nextFreeSlot, setNextFreeSlot] = useState<Date | null>(null);
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus | null>(null);
  const [quoteUpdatedAt, setQuoteUpdatedAt] = useState<string | null>(null);
  const [viewStats, setViewStats] = useState<Awaited<ReturnType<typeof getQuoteViewStats>> | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(id ?? null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [quoteType, setQuoteType] = useState<QuoteType>('quote');
  const [template, setTemplate] = useState<QuoteTemplate>('corporate');
  /** null = usar el color de marca guardado en Configuración. */
  const [brandColor, setBrandColor] = useState<string | null>(null);
  const [showDesign, setShowDesign] = useState(false);
  const [showBlocks, setShowBlocks] = useState(false);

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
  const [borradorRecuperado, setBorradorRecuperado] = useState(false);

  const [bonoInput, setBonoInput] = useState('');
  const [bonoLoading, setBonoLoading] = useState(false);
  const [bonoError, setBonoError] = useState('');
  const [bonoParcial, setBonoParcial] = useState<DescuentoDeBono | null>(null);

  // ── Quién firma ────────────────────────────────────────────────────────
  //
  // La cotización creaba UN firmante: el cliente. Quien la enviaba no firmaba
  // nunca, aunque muchas veces quiera hacerlo — una cotización firmada por
  // las dos partes es un acuerdo, y firmada por una sola es sólo una oferta
  // aceptada. Ahora se pregunta antes de mandarla.
  const [preguntandoQuienFirma, setPreguntandoQuienFirma] = useState(false);
  const [firmandoYo, setFirmandoYo] = useState(false);
  const [miFirma, setMiFirma] = useState<string | null>(null);

  // ── Borrador local ─────────────────────────────────────────────────────
  //
  // Todo lo escrito vivía sólo en el estado de React. Bastaba con recargar,
  // volver atrás, o que el móvil descargara la pestaña de memoria para
  // perder una cotización entera sin haber tocado nada — y quien la había
  // llenado tenía que empezar de cero.
  //
  // Se guarda en localStorage mientras se escribe y se recupera al volver.
  // Es local a propósito: guardar en el servidor cada tecla crearía
  // cotizaciones a medio hacer que consumirían cupo y ensuciarían el panel.
  const claveBorrador = `codec:cotizacion:${quoteId ?? 'nueva'}`;

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(claveBorrador, JSON.stringify({
          clientName, clientCompany, clientPosition, clientEmail, clientPhone, clientAddress,
          projectName, executiveSummary, projectObjective, projectScope,
          items, blocks, template, brandColor, quoteType,
          guardadoEn: Date.now(),
        }));
      } catch { /* sin espacio en disco o modo privado: no es motivo para romper el editor */ }
    }, 600);
    return () => clearTimeout(t);
  }, [
    claveBorrador, loading, clientName, clientCompany, clientPosition, clientEmail,
    clientPhone, clientAddress, projectName, executiveSummary, projectObjective,
    projectScope, items, blocks, template, brandColor, quoteType,
  ]);

  useEffect(() => {
    if (!isEditing) {
      detectSignerCountryCode().then(setCountryCode).catch(() => {});
      // Al abrir una cotización nueva se mira si quedó algo a medio escribir.
      try {
        const crudo = localStorage.getItem('codec:cotizacion:nueva');
        if (!crudo) return;
        const b = JSON.parse(crudo) as Record<string, unknown> & { guardadoEn?: number };
        // Una semana. Más allá, lo que hay guardado ya no es «lo que estaba
        // escribiendo» sino un resto olvidado que confunde más que ayuda.
        if (!b.guardadoEn || Date.now() - b.guardadoEn > 7 * 24 * 60 * 60 * 1000) {
          localStorage.removeItem('codec:cotizacion:nueva');
          return;
        }
        if (!String(b.clientName ?? '').trim() && !(Array.isArray(b.items) && b.items.length > 1)) return;

        setClientName(String(b.clientName ?? '')); setClientCompany(String(b.clientCompany ?? ''));
        setClientPosition(String(b.clientPosition ?? '')); setClientEmail(String(b.clientEmail ?? ''));
        setClientPhone(String(b.clientPhone ?? '')); setClientAddress(String(b.clientAddress ?? ''));
        setProjectName(String(b.projectName ?? '')); setExecutiveSummary(String(b.executiveSummary ?? ''));
        setProjectObjective(String(b.projectObjective ?? '')); setProjectScope(String(b.projectScope ?? ''));
        if (Array.isArray(b.items) && b.items.length) setItems(b.items as QuoteLineItem[]);
        if (b.blocks && typeof b.blocks === 'object') setBlocks(b.blocks as ProposalBlocks);
        if (b.template) setTemplate(b.template as QuoteTemplate);
        if (typeof b.brandColor === 'string' || b.brandColor === null) setBrandColor(b.brandColor as string | null);
        if (b.quoteType) setQuoteType(b.quoteType as QuoteType);
        setBorradorRecuperado(true);
      } catch { /* un borrador ilegible se ignora, no se avisa */ }
      return;
    }
    getMyQuoteFull(id!).then((full) => {
      if (!full) { toast.error(language === 'en' ? 'Quote not found.' : 'Cotización no encontrada.'); navigate('/my-quotes'); return; }
      const { quote, items: loadedItems } = full;
      setQuoteId(quote.id);
      setCountryCode(quote.country);
      setQuoteType(quote.quote_type);
      // `template` guarda maqueta y color juntos ("corporate|#B91C1C"); ver
      // parseTemplate en quote-pdf-generator.ts.
      const { layout, color } = parseTemplate(quote.template);
      setTemplate(layout);
      setBrandColor(color);
      setClientName(quote.client_name); setClientCompany(quote.client_company ?? '');
      setClientPosition(quote.client_position ?? ''); setClientEmail(quote.client_email ?? '');
      setClientPhone(quote.client_phone ?? ''); setClientAddress(quote.client_address ?? '');
      setProjectName(quote.project_name ?? ''); setExecutiveSummary(quote.executive_summary ?? '');
      setProjectObjective(quote.project_objective ?? ''); setProjectScope(quote.project_scope ?? '');
      setItems(loadedItems.length > 0 ? loadedItems : [{ ...EMPTY_ITEM }]);
      setBlocks(quote.proposal_blocks ?? {});
      setQuoteStatus(quote.status);
      setQuoteUpdatedAt(quote.updated_at);
      setLoading(false);

      // "El cliente abrió la propuesta hace 2 horas" — only meaningful once
      // it's actually been sent (a draft has no signing link, so no views).
      if (quote.status !== 'draft') {
        getQuoteViewStats(quote.id).then(setViewStats).catch(() => {});
      }
    }).catch(() => { toast.error(language === 'en' ? 'Could not load the quote.' : 'No se pudo cargar la cotización.'); navigate('/my-quotes'); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const totals = computeQuoteTotals(items);
  const documentTitle = getQuoteDocumentTitle(countryCode, quoteType, language);

  const updateItem = (index: number, patch: Partial<QuoteLineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };
  // Etiqueta compartida para "son opciones, no se suman". El control global
  // de abajo (sonOpciones) solo decide el caso simple —TODO se suma, o TODO
  // es una alternativa—; el campo por ítem sigue existiendo para el caso
  // mixto (p. ej. 3 planes + un cargo fijo de instalación que sí se suma).
  const GRUPO_OPCIONES = language === 'en' ? 'Options' : 'Opciones';
  // "Son opciones" si CADA ítem ya tiene algún grupo puesto — no importa el
  // texto exacto (la IA puede haber usado "Planes" en vez de "Opciones"),
  // lo que importa es si el estado actual es "todo agrupado" o no.
  const sonOpciones = items.length > 0 && items.every((it) => (it.option_group || '').trim() !== '');
  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM, option_group: sonOpciones ? GRUPO_OPCIONES : null }]);
  const removeItem = (index: number) => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  const alternarModoOpciones = () => {
    setItems((prev) => prev.map((it) => ({ ...it, option_group: sonOpciones ? null : GRUPO_OPCIONES })));
  };

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
    template: buildTemplateValue(template, brandColor),
  });

  /** Actually inserts the quote row — called either directly (free slot
   * available) or after a successful $6.99 PayPal capture. */
  const finalizeNewQuote = async (): Promise<string> => {
    const newId = await createQuote(buildQuoteInput(), items);
    // Ya está en el servidor: el borrador local sobra, y dejarlo haría que la
    // próxima cotización nueva apareciera rellenada con la anterior.
    try { localStorage.removeItem('codec:cotizacion:nueva'); } catch { /* da igual */ }
    setBorradorRecuperado(false);
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
      await verifyPaypalOrder({ orderId, product: 'quote_single', promoCode: bonoParcial?.code });
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

  /** Client-side only — genera el PDF exacto tal como está el formulario
   * ahora mismo (misma función que usa el envío real). Sin guardar, sin
   * subir a nada: sirve tanto para comparar plantillas como para que quien
   * está armando la cotización vea el documento final ANTES de decidir si
   * lo manda a firmar o no. */
  const generarPdfDelBorrador = async () => {
    const branding = user?.id ? await getUserBranding(user.id) : null;
    const draftQuote = {
      id: quoteId ?? 'preview', user_id: user?.id ?? '', quote_number: 'PREVIEW',
      status: 'draft' as const, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      pdf_url: null, signed: false, signature_transaction_id: null,
      ...buildQuoteInput(),
    };
    return generateQuotePdf(
      draftQuote as Parameters<typeof generateQuotePdf>[0], items,
      aBrandingDePdf(branding),
      documentTitle,
    );
  };

  const handlePreview = async () => {
    if (!clientName.trim()) {
      toast.error(language === 'en' ? 'Add a client name to preview.' : 'Agrega un nombre de cliente para previsualizar.');
      return;
    }
    setPreviewing(true);
    try {
      const pdfBytes = await generarPdfDelBorrador();
      const blobUrl = URL.createObjectURL(new Blob([pdfBytes as BlobPart], { type: 'application/pdf' }));
      window.open(blobUrl, '_blank');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not generate preview.' : 'No se pudo generar la vista previa.'));
    } finally {
      setPreviewing(false);
    }
  };

  /** Descarga directa del PDF del borrador, sin pasar por firma ni por el
   *  cliente — para cuando quien cotiza sólo quiere el archivo. */
  const handleDownload = async () => {
    if (!clientName.trim()) {
      toast.error(language === 'en' ? 'Add a client name to download.' : 'Agrega un nombre de cliente para descargar.');
      return;
    }
    setDownloading(true);
    try {
      const pdfBytes = await generarPdfDelBorrador();
      const blobUrl = URL.createObjectURL(new Blob([pdfBytes as BlobPart], { type: 'application/pdf' }));
      const nombreArchivo = `${(projectName || documentTitle || 'cotizacion').replace(/[^a-z0-9-_]+/gi, '-')}.pdf`;
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not download the document.' : 'No se pudo descargar el documento.'));
    } finally {
      setDownloading(false);
    }
  };

  /** Punto de entrada del botón: antes de mandar nada, se pregunta quién
   *  firma. La opción se pregunta AQUÍ y no al final porque si el remitente
   *  quiere firmar, su firma tiene que existir antes de generarse el enlace
   *  del cliente — si no, el cliente firmaría un documento donde falta la
   *  firma de quien se lo mandó. */
  const abrirQuienFirma = () => {
    if (!clientEmail.trim()) {
      toast.error(language === 'en' ? 'Client email is required to request a signature.' : 'El correo del cliente es obligatorio para solicitar firma.');
      return;
    }
    setPreguntandoQuienFirma(true);
  };

  const handleRequestSignature = async (firmaPropia?: string | null) => {
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

      const pdfBytes = await generateQuotePdf(full.quote, full.items, aBrandingDePdf(branding), documentTitle);
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

      const documentId = await createDocumentRecord({ name: projectName || full.quote.quote_number, userId: user?.id ?? null });
      const pdfUrl = await uploadPdfToStorage(documentId, pdfBlob);
      await updateDocumentPdfUrl(documentId, pdfUrl);

      // Mi firma va PRIMERO, antes de generar el enlace del cliente: si se
      // registrara después, habría un momento en que el cliente puede abrir y
      // firmar un documento al que todavía le falta la firma de quien se lo
      // mandó. Mismo procedimiento que usa el flujo de firmas normal —
      // subida de la imagen, huella SHA-256 e IP para la pista de auditoría.
      if (firmaPropia) {
        try {
          const blob = await dataUrlToBlob(firmaPropia);
          const sigUrl = await uploadSignatureImage(documentId, 'creator', blob);
          await sha256Hex(await blob.arrayBuffer());
          const ip = await getPublicIp();
          await insertSignature({
            documentId,
            signerName: user?.name || user?.email || 'Emisor',
            signerEmail: user?.email ?? '',
            ip,
            userAgent: navigator.userAgent,
            signatureUrl: sigUrl,
          });
        } catch (err) {
          // Que falle mi firma no puede impedir que la cotización salga: se
          // avisa y se sigue, en vez de dejar el envío a medias.
          console.error('[cotizacion] no se pudo registrar la firma del emisor:', err);
          toast.error(language === 'en'
            ? 'Your signature could not be saved, but the quote was sent.'
            : 'No se pudo guardar tu firma, pero la cotización sí se envió.');
        }
      }

      const signerId = await createSigner({ documentId, name: clientName, email: clientEmail });
      const token = await createSigningLink({ documentId, signerId, guestName: clientName, guestEmail: clientEmail });
      await linkQuoteSignature(savedId, documentId);
      await setQuotePdfAndStatus(savedId, pdfUrl, 'sent');

      setShareLink(`${SITE_URL}/guest-sign/${token}`);
      setQuoteStatus('sent');
      setViewStats({ viewCount: 0, firstViewedAt: null, lastViewedAt: null, countries: [] });
      toast.success(language === 'en' ? 'Signature request created!' : '¡Solicitud de firma creada!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not request the signature.' : 'No se pudo solicitar la firma.'));
    } finally {
      setRequestingSignature(false);
    }
  };

  /** Asunto y cuerpo del envío. Se arman con lo que ya hay en el formulario
   *  —nombre del cliente, proyecto, total— para que el mensaje diga algo, en
   *  vez de mandar un enlace suelto. */
  const asuntoDeEnvio = () => {
    const quien = projectName || documentTitle;
    return language === 'en' ? `${quien} — quote for you` : `${quien} — cotización para ti`;
  };

  const mensajeDeEnvio = () => {
    const saludo = clientName ? (language === 'en' ? `Hi ${clientName},` : `Hola ${clientName},`) : (language === 'en' ? 'Hi,' : 'Hola,');
    const cuerpo = language === 'en'
      ? `here is the ${documentTitle.toLowerCase()} we prepared for you${projectName ? ` for ${projectName}` : ''}. Total: $${totals.total.toFixed(2)}.\n\nYou can review it and sign it here:`
      : `aquí tienes la ${documentTitle.toLowerCase()} que preparamos para ti${projectName ? ` para ${projectName}` : ''}. Total: $${totals.total.toFixed(2)}.\n\nPuedes revisarla y firmarla aquí:`;
    return `${saludo} ${cuerpo}\n${shareLink ?? ''}`;
  };

  /** Aplica un bono en el cobro de la cotización. Uno del 100% la desbloquea
   *  y la crea al momento; uno parcial sólo rebaja el importe de PayPal. */
  const aplicarBono = async () => {
    const code = bonoInput.trim().toUpperCase();
    if (!code) return;
    setBonoLoading(true);
    setBonoError('');
    try {
      const contexto = { product: 'quote_single' as const };
      const info = await consultarDescuento(code, contexto);
      if (info && info.discountPct < 100) {
        setBonoParcial(info);
        return;
      }
      await redeemPromoCode(code, contexto);
      await finalizeNewQuote();
      toast.success(language === 'en' ? 'Coupon applied — quote created!' : '¡Bono aplicado — cotización creada!');
    } catch (err) {
      setBonoError(err instanceof Error ? err.message : (language === 'en' ? 'Invalid code.' : 'Código inválido.'));
    } finally {
      setBonoLoading(false);
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

        {borradorRecuperado && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <RefreshCw className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-800">
              {language === 'en'
                ? 'We brought back what you had written but had not saved yet. Keep going where you left off, or clear it and start fresh.'
                : 'Recuperamos lo que habías escrito y aún no habías guardado. Sigue donde lo dejaste, o bórralo y empieza de nuevo.'}
              <button
                type="button"
                onClick={() => {
                  try { localStorage.removeItem('codec:cotizacion:nueva'); } catch { /* da igual */ }
                  window.location.reload();
                }}
                className="ml-2 font-bold underline"
              >
                {language === 'en' ? 'Start fresh' : 'Empezar de nuevo'}
              </button>
            </p>
          </div>
        )}

        {quoteStatus && quoteStatus !== 'draft' && (
          <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                <Activity className="size-3.5" />
                {language === 'en' ? 'Client activity' : 'Actividad del cliente'}
              </p>
              <button
                type="button"
                onClick={() => quoteId && getQuoteViewStats(quoteId).then(setViewStats).catch(() => {})}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-500 hover:text-indigo-700"
              >
                <RefreshCw className="size-3" /> {language === 'en' ? 'Refresh' : 'Actualizar'}
              </button>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              {!viewStats || viewStats.viewCount === 0 ? (
                <p className="flex items-center gap-1.5">
                  <Eye className="size-3.5 text-slate-400" />
                  {language === 'en' ? "The client hasn't opened the quote yet." : 'El cliente aún no ha abierto la cotización.'}
                </p>
              ) : (
                <>
                  <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Eye className="size-3.5 text-indigo-500" />
                    {language === 'en'
                      ? `The client opened the quote ${viewStats.lastViewedAt ? formatRelativeTime(viewStats.lastViewedAt, 'en') : ''}.`
                      : `El cliente abrió la propuesta ${viewStats.lastViewedAt ? formatRelativeTime(viewStats.lastViewedAt, 'es') : ''}.`}
                  </p>
                  <p className="pl-5 text-slate-500">
                    {viewStats.viewCount === 1
                      ? (language === 'en' ? 'Opened it once.' : 'La abrió una vez.')
                      : (language === 'en' ? `Opened it ${viewStats.viewCount} times.` : `La abrió ${viewStats.viewCount} veces.`)}
                  </p>
                  {viewStats.countries.length > 0 && (
                    <p className="flex items-center gap-1.5 pl-5 text-slate-500">
                      <Globe2 className="size-3 text-slate-400" />
                      {viewStats.countries.join(', ')}
                    </p>
                  )}
                </>
              )}
              {quoteStatus === 'accepted' && quoteUpdatedAt && (
                <p className="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <PenLine className="size-3.5" />
                  {language === 'en' ? `Signed ${formatRelativeTime(quoteUpdatedAt, 'en')}.` : `Firmó ${formatRelativeTime(quoteUpdatedAt, 'es')}.`}
                </p>
              )}
            </div>
          </div>
        )}

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

            {/* Enviar por WhatsApp o correo.
                El mensaje va ya redactado: quien acaba de armar una
                cotización no debería tener que escribir además el mensaje
                con el que la manda, y una cotización que llega como un enlace
                pelado y sin contexto parece correo basura. */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(mensajeDeEnvio())}`, '_blank', 'noopener')}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-2.5 text-xs font-bold text-white shadow-sm"
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </button>
              <a
                href={`mailto:${clientEmail}?subject=${encodeURIComponent(asuntoDeEnvio())}&body=${encodeURIComponent(mensajeDeEnvio())}`}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-700 py-2.5 text-xs font-bold text-white shadow-sm"
              >
                <Mail className="size-4" />
                {language === 'en' ? 'Email' : 'Correo'}
              </a>
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
          {/* Cajón de diseño. Plegado por defecto: quien entra a mandar una
              cotización no viene a elegir un color, y dieciséis tonos a la
              vista convierten la pantalla en un catálogo. */}
          <button
            type="button"
            onClick={() => setShowDesign((v) => !v)}
            className="mt-4 flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5 text-left"
          >
            <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <Palette className="size-3.5 text-slate-400" />
              {language === 'en' ? 'More colours' : 'Más colores'}
              <span className="font-normal text-slate-400">
                {brandColor
                  ? (language === 'en' ? 'custom' : 'personalizado')
                  : (language === 'en' ? 'using your brand colour' : 'usando el color de tu marca')}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="size-4 rounded-full ring-1 ring-black/10" style={{ background: brandColor ?? '#CBD5E1' }} />
              {showDesign ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
            </span>
          </button>

          {showDesign && (
            <div className="mt-3 rounded-2xl border border-slate-100 p-4">
              <div className="grid grid-cols-8 gap-2">
                {COLORES.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={language === 'en' ? c.en : c.es}
                    onClick={() => setBrandColor(c.hex)}
                    className={`flex aspect-square items-center justify-center rounded-xl ring-offset-1 transition ${
                      brandColor === c.hex ? 'ring-2 ring-slate-800' : 'ring-1 ring-black/10 hover:ring-slate-400'
                    }`}
                    style={{ background: c.hex }}
                  >
                    {brandColor === c.hex && <Check className="size-3.5 text-white" />}
                  </button>
                ))}
              </div>
              {brandColor && (
                <button
                  type="button"
                  onClick={() => setBrandColor(null)}
                  className="mt-3 text-[11px] font-semibold text-slate-500 underline hover:text-slate-700"
                >
                  {language === 'en' ? 'Back to my brand colour' : 'Volver al color de mi marca'}
                </button>
              )}
            </div>
          )}

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

        {/* Nombre del proyecto: una sola línea, junto a los datos del cliente,
            porque es parte de a quién y para qué va dirigida la cotización.
            El resumen, el objetivo y el alcance se fueron al cajón de abajo:
            eran tres textos largos de relleno obligatorio en la mitad de la
            pantalla, y el cuerpo de la propuesta ya cuenta todo eso. */}
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className={labelClass}>{language === 'en' ? 'Project or subject' : 'Proyecto o asunto'}</label>
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className={inputClass}
            placeholder={language === 'en' ? 'Corporate planners 2026' : 'Dotación de agendas 2026'}
          />
        </div>

        {/* Line items */}
        <div data-seccion-voz="items" className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-1 text-sm font-bold text-slate-800">{language === 'en' ? 'Products & Services' : 'Productos y Servicios'}</p>
          {/* Control global del caso simple: TODO se suma (una tienda que
              cotiza agendas + logos + papel, cada uno se paga aparte) o TODO
              es una alternativa (3 planes de página web, el cliente elige
              uno). Para un caso mixto —algunas líneas fijas, otras
              alternativas— se sigue pudiendo ajustar ítem por ítem más
              abajo, este switch solo pone o quita el valor por defecto. */}
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => { if (sonOpciones) alternarModoOpciones(); }}
              className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold transition ${!sonOpciones ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400'}`}
            >
              {language === 'en' ? 'Add up all products' : 'Sumar todos los productos'}
            </button>
            <button
              type="button"
              onClick={() => { if (!sonOpciones) alternarModoOpciones(); }}
              className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold transition ${sonOpciones ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400'}`}
            >
              {language === 'en' ? 'These are alternative options' : 'Son opciones — el cliente elige una'}
            </button>
          </div>
          <p className="mb-4 text-[11px] text-slate-400">
            {sonOpciones
              ? (language === 'en'
                ? 'Each product below is shown on its own, and the client picks one — prices are not added together.'
                : 'Cada producto de abajo se muestra por separado y el cliente elige uno — los precios no se suman.')
              : (language === 'en'
                ? 'Every product below adds to the total, like a store quoting several different items at once.'
                : 'Cada producto de abajo se suma al total, como una tienda cotizando varios artículos distintos a la vez.')}
          </p>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                    placeholder={language === 'en'
                      ? 'Description of the product or service'
                      : 'Descripción del producto o servicio'}
                    className={`${inputClass} bg-white`}
                  />
                  <button type="button" onClick={() => removeItem(i)} className="shrink-0 text-slate-300 hover:text-red-500"><Trash2 className="size-4" /></button>
                </div>
                {/* Cada casilla lleva de fondo un ejemplo de lo que va en
                    ella, y desaparece al escribir. Sin eso, cinco casillas
                    numéricas seguidas no dicen cuál es cuál.

                    Los números se pintan con `|| ''` para que un 0 se vea
                    vacío y deje leer el ejemplo: un input de tipo number con
                    valor 0 muestra «0» y tapa el placeholder, que es
                    justamente donde estaba la duda. */}
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold text-slate-400">{language === 'en' ? 'Quantity' : 'Cantidad'}</span>
                    <input
                      type="number" min={0} inputMode="decimal"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                      placeholder="1"
                      className={`${inputClass} bg-white text-xs`}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold text-slate-400">{language === 'en' ? 'Unit of measure' : 'Unidad de medida'}</span>
                    <input
                      value={item.unit}
                      onChange={(e) => updateItem(i, { unit: e.target.value })}
                      placeholder={language === 'en' ? 'units, grams, litres…' : 'unidades, gramos, litros…'}
                      className={`${inputClass} bg-white text-xs`}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold text-slate-400">{language === 'en' ? 'Unit price' : 'Precio unitario'}</span>
                    <input
                      type="number" min={0} inputMode="decimal"
                      value={item.unit_price || ''}
                      onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })}
                      placeholder={language === 'en' ? 'Price per unit' : 'Precio por unidad'}
                      className={`${inputClass} bg-white text-xs`}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold text-slate-400">{language === 'en' ? 'Discount' : 'Descuento'}</span>
                    <input
                      type="number" min={0} max={100} inputMode="decimal"
                      value={item.discount_pct || ''}
                      onChange={(e) => updateItem(i, { discount_pct: Number(e.target.value) })}
                      placeholder={language === 'en' ? '% discount' : '% de descuento'}
                      className={`${inputClass} bg-white text-xs`}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold text-slate-400">{language === 'en' ? 'Tax' : 'Impuesto'}</span>
                    <input
                      type="number" min={0} max={100} inputMode="decimal"
                      value={item.tax_pct || ''}
                      onChange={(e) => updateItem(i, { tax_pct: Number(e.target.value) })}
                      placeholder={language === 'en' ? '% tax' : '% de IVA'}
                      className={`${inputClass} bg-white text-xs`}
                    />
                  </label>
                </div>
                <label className="mt-2 block">
                  <span className="mb-1 block text-[10px] font-semibold text-slate-400">
                    {language === 'en'
                      ? 'Alternative option group (leave empty for a normal item)'
                      : 'Grupo de opciones alternativas (déjalo vacío si es un ítem normal)'}
                  </span>
                  <input
                    value={item.option_group || ''}
                    onChange={(e) => updateItem(i, { option_group: e.target.value })}
                    placeholder={language === 'en' ? 'e.g. "Plans" — same text on every option' : 'ej. "Planes" — el mismo texto en cada opción'}
                    className={`${inputClass} bg-white text-xs`}
                  />
                  {item.option_group?.trim() && (
                    <span className="mt-1 block text-[10px] text-amber-600">
                      {language === 'en'
                        ? "Grouped with every other item using this exact text — shown as a choice, not added to the total."
                        : 'Se agrupa con cualquier otro ítem que use este mismo texto — se muestra como una opción a elegir, no se suma al total.'}
                    </span>
                  )}
                </label>
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

        <PropuestaComercial
          texto={blocks.pitch ?? ''}
          onTexto={(v) => setBlocks((prev) => ({ ...prev, pitch: v }))}
          language={language}
          clientName={clientName}
          clientCompany={clientCompany}
          projectName={projectName}
          onItems={setItems}
          onCliente={(c) => {
            // Sólo lo que esté vacío: si el cliente ya venía escrito (o el
            // usuario ya lo había tecleado), lo dicho por voz no lo pisa.
            if (c.name && !clientName.trim()) setClientName(c.name);
            if (c.phone && !clientPhone.trim()) setClientPhone(c.phone);
            if (c.email && !clientEmail.trim()) setClientEmail(c.email);
          }}
          onAutocompletar={({ client, project }) => {
            if (client.name && !clientName.trim()) setClientName(client.name);
            if (client.company && !clientCompany.trim()) setClientCompany(client.company);
            if (client.position && !clientPosition.trim()) setClientPosition(client.position);
            if (client.email && !clientEmail.trim()) setClientEmail(client.email);
            if (client.phone && !clientPhone.trim()) setClientPhone(client.phone);
            if (client.address && !clientAddress.trim()) setClientAddress(client.address);
            if (project.name && !projectName.trim()) setProjectName(project.name);
            if (project.summary && !executiveSummary.trim()) setExecutiveSummary(project.summary);
            if (project.objective && !projectObjective.trim()) setProjectObjective(project.objective);
            if (project.scope && !projectScope.trim()) setProjectScope(project.scope);
          }}
        />

        {/* El camino largo: las diez secciones sueltas y los tres textos de
            proyecto. Plegado, porque para mandar una cotización de treinta
            agendas no hace falta nada de esto — pero quien arma propuestas por
            secciones lo sigue teniendo entero. */}
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setShowBlocks((v) => !v)}
            className="flex w-full items-center justify-between px-6 py-4 text-left"
          >
            <span>
              <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <SlidersHorizontal className="size-4 text-slate-400" />
                {language === 'en' ? 'Break it into sections' : 'Separar la propuesta en secciones'}
              </span>
              <span className="mt-0.5 block pl-6 text-xs text-slate-400">
                {language === 'en'
                  ? 'Optional. Summary, scope, timeline, terms, warranty…'
                  : 'Opcional. Resumen, alcance, cronograma, condiciones, garantías…'}
              </span>
            </span>
            {showBlocks ? <ChevronUp className="size-4 shrink-0 text-slate-400" /> : <ChevronDown className="size-4 shrink-0 text-slate-400" />}
          </button>

          {showBlocks && (
          <div className="border-t border-slate-100 p-6">
          <label className={labelClass}>{language === 'en' ? 'Executive summary' : 'Resumen ejecutivo'}</label>
          <textarea value={executiveSummary} onChange={(e) => setExecutiveSummary(e.target.value)} rows={2} className={inputClass} />
          <DictadoYMejora
            valor={executiveSummary}
            onCambio={setExecutiveSummary}
            language={language}
            contexto={language === 'en' ? 'Executive summary' : 'Resumen ejecutivo'}
            tono="letter"
          />
          <label className={`${labelClass} mt-3`}>{language === 'en' ? 'Objective' : 'Objetivo'}</label>
          <textarea value={projectObjective} onChange={(e) => setProjectObjective(e.target.value)} rows={2} className={inputClass} />
          <DictadoYMejora
            valor={projectObjective}
            onCambio={setProjectObjective}
            language={language}
            contexto={language === 'en' ? 'Project objective' : 'Objetivo del proyecto'}
            tono="letter"
          />
          <label className={`${labelClass} mt-3`}>{language === 'en' ? 'Scope' : 'Alcance'}</label>
          <textarea value={projectScope} onChange={(e) => setProjectScope(e.target.value)} rows={2} className={inputClass} />
          <DictadoYMejora
            valor={projectScope}
            onCambio={setProjectScope}
            language={language}
            contexto={language === 'en' ? 'Project scope' : 'Alcance del proyecto'}
            tono="letter"
          />

          <div className="mt-5 space-y-2">
            {BLOCK_KEYS.map(({ key, es, en }) => (
              <div key={key} className="rounded-xl border border-slate-100">
                <button type="button" onClick={() => toggleBlock(key)} className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm font-semibold text-slate-700">
                  {language === 'en' ? en : es}
                  {openBlocks.has(key) ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
                </button>
                {openBlocks.has(key) && (
                  <div className="border-t border-slate-100">
                    <textarea
                      value={blocks[key] ?? ''}
                      onChange={(e) => setBlocks((prev) => ({ ...prev, [key]: e.target.value }))}
                      rows={3}
                      className="w-full px-3.5 py-2.5 text-sm outline-none"
                      placeholder={language === 'en' ? en : es}
                    />
                    <div className="px-3.5 pb-2.5">
                      <DictadoYMejora
                        valor={blocks[key] ?? ''}
                        onCambio={(v) => setBlocks((prev) => ({ ...prev, [key]: v }))}
                        language={language}
                        contexto={language === 'en' ? en : es}
                        tono={CLAUSULAS_DE_PROPUESTA.has(key) ? 'clause' : 'letter'}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          </div>
          )}
        </div>

        {/* Ver / descargar el documento ANTES de decidir si se manda a
            firmar — quien cotiza necesita poder revisar el PDF final con
            sus propios ojos, o simplemente quedárselo sin pedir firma a
            nadie, sin que eso implique guardar ni enviar nada todavía. */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={previewing}
            onClick={() => void handlePreview()}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-indigo-200 bg-white px-6 py-3 text-sm font-bold text-indigo-700 disabled:opacity-50"
          >
            {previewing ? <Loader className="size-4 animate-spin" /> : <Eye className="size-4" />}
            {language === 'en' ? 'View document' : 'Ver documento'}
          </button>
          <button
            type="button"
            disabled={downloading}
            onClick={() => void handleDownload()}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 disabled:opacity-50"
          >
            {downloading ? <Loader className="size-4 animate-spin" /> : <Download className="size-4" />}
            {language === 'en' ? 'Download' : 'Descargar'}
          </button>
        </div>

        <div className="mt-3 flex gap-3">
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
            onClick={abrirQuienFirma}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg disabled:opacity-50"
          >
            {requestingSignature ? <Loader className="size-4 animate-spin" /> : <Send className="size-4" />}
            {language === 'en' ? 'Request signature' : 'Solicitar firma'}
          </button>
        </div>

        {/* ── ¿Quién firma? ──────────────────────────────────────────────
            Se pregunta siempre, porque la respuesta no es evidente: hay
            cotizaciones que sólo acepta el cliente y otras que las dos partes
            quieren dejar firmadas. */}
        {preguntandoQuienFirma && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
            onClick={() => setPreguntandoQuienFirma(false)}
          >
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <p className="text-base font-black text-slate-900">
                {language === 'en' ? 'Who signs this quote?' : '¿Quién firma esta cotización?'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {language === 'en'
                  ? 'Signed by both parties it reads as an agreement; signed only by your client, as an accepted offer.'
                  : 'Firmada por las dos partes se lee como un acuerdo; firmada sólo por tu cliente, como una oferta aceptada.'}
              </p>

              <button
                type="button"
                onClick={() => { setPreguntandoQuienFirma(false); void handleRequestSignature(null); }}
                className="mt-5 w-full rounded-2xl border-2 border-slate-200 px-4 py-3.5 text-left transition hover:border-indigo-300"
              >
                <p className="text-sm font-bold text-slate-800">
                  {language === 'en' ? 'Only my client' : 'Solo mi cliente'}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {language === 'en' ? 'They receive it, review it and sign.' : 'La recibe, la revisa y firma.'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => { setPreguntandoQuienFirma(false); setFirmandoYo(true); }}
                className="mt-2.5 w-full rounded-2xl border-2 border-indigo-300 bg-indigo-50/50 px-4 py-3.5 text-left transition hover:border-indigo-400"
              >
                <p className="flex items-center gap-1.5 text-sm font-bold text-indigo-800">
                  <PenLine className="size-3.5" />
                  {language === 'en' ? 'My client and me' : 'Mi cliente y yo'}
                </p>
                <p className="mt-0.5 text-xs text-indigo-600/80">
                  {language === 'en' ? 'You sign now; your client signs from the link.' : 'Tú firmas ahora; tu cliente firma desde el enlace.'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPreguntandoQuienFirma(false)}
                className="mt-4 w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                {language === 'en' ? 'Cancel' : 'Cancelar'}
              </button>
            </div>
          </div>
        )}

        <SignatureModal
          open={firmandoYo}
          onOpenChange={setFirmandoYo}
          signerName={user?.email ?? ''}
          title={language === 'en' ? 'Your signature' : 'Tu firma'}
          subtitle={language === 'en'
            ? 'Sign here and we will send the quote to your client right away.'
            : 'Firma aquí y enviamos la cotización a tu cliente enseguida.'}
          userId={user?.id}
          onConfirm={(dataUrl) => {
            setMiFirma(dataUrl);
            setFirmandoYo(false);
            void handleRequestSignature(dataUrl);
          }}
        />

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

            {/* Campo de bono. Esta ventana de cobro no lo tenía, así que un
                bono repartido para cotizaciones no había dónde escribirlo. */}
            <div className="mb-3">
              <label className="mb-1.5 block text-[11px] font-bold text-amber-900">
                {language === 'en' ? 'Have a coupon?' : '¿Tienes un bono de descuento?'}
              </label>
              <div className="flex gap-2">
                <input
                  value={bonoInput}
                  onChange={(e) => { setBonoInput(e.target.value.toUpperCase()); setBonoError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') void aplicarBono(); }}
                  placeholder={language === 'en' ? 'Enter code' : 'Escribe el código'}
                  className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm uppercase tracking-wide outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  disabled={bonoLoading || !bonoInput.trim()}
                  onClick={() => void aplicarBono()}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {bonoLoading ? (language === 'en' ? 'Checking…' : 'Verificando…') : (language === 'en' ? 'Apply' : 'Aplicar')}
                </button>
              </div>
              {bonoError && <p className="mt-1.5 text-xs text-red-600">{bonoError}</p>}
              {bonoParcial && (
                <p className="mt-1.5 text-xs font-semibold text-amber-900">
                  {language === 'en'
                    ? `${bonoParcial.discountPct}% off — pay below to finish.`
                    : `${bonoParcial.discountPct}% de descuento — paga abajo para terminar.`}
                </p>
              )}
            </div>

            {payingForQuote ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-white py-4 text-sm text-slate-600">
                <Loader className="size-4 animate-spin" />
                {language === 'en' ? 'Confirming payment…' : 'Confirmando pago…'}
              </div>
            ) : getPayPalClientId() ? (
              <PayPalScriptProvider options={{ clientId: getPayPalClientId(), currency: 'USD', intent: 'capture', components: 'buttons' }}>
                <QuotePaywallButtons onApprove={handlePaidQuoteApprove} descuento={bonoParcial} />
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
