/**
 * Bonos de descuento y documentos de regalo — sólo para el administrador.
 *
 * Son dos herramientas separadas a propósito, no dos pestañas de la misma
 * cosa, porque funcionan al revés la una de la otra:
 *
 *   · BONO   — se crea una palabra («BONO», «BOLA») con un porcentaje y una
 *              vigencia. No va dirigido a nadie: se reparte, y quien lo tenga
 *              lo escribe donde dice «¿Tienes un bono de descuento?».
 *   · REGALO — va dirigido a UNA persona por su correo. No hay código que
 *              escribir: le aparecen los documentos y le suena un aviso.
 *
 * Un bono del 100% libera el producto entero (es el comportamiento que la
 * plataforma ya tenía). Uno del 40% descuenta y la persona paga el 60%
 * restante; el precio rebajado lo recalcula el servidor en cada compra —
 * ver supabase/functions/paypal-verify/index.ts.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Ticket, Gift, Loader, Plus, Copy, CheckCheck, Power, Clock, Users, Percent, Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  listPromoCodes, createPromoCode, setPromoCodeActive, DURACIONES,
  crearPlanRebajado, listarPlanesRebajados, PRODUCTOS_DE_SUSCRIPCION,
  type PromoCode, type PlanRebajado,
} from '../../services/promo-admin-service';
import {
  giftDocuments, listGiftedDocuments, type AdminGiftRow,
} from '../../services/document-gifts-service';

/**
 * Qué libera un bono. Son los mismos identificadores que entiende
 * paypal-verify; cambiarlos aquí sin cambiarlos allí crea bonos que se
 * canjean y no conceden nada.
 */
const PRODUCTOS: Array<{ id: string; es: string; en: string }> = [
  { id: 'full_access', es: 'Acceso completo (documentos + firmas)', en: 'Full access (documents + signatures)' },
  { id: 'doc_single', es: 'Un documento', en: 'A single document' },
  { id: 'doc_bundle', es: 'Paquete de documentos', en: 'Document bundle' },
  { id: 'sig_single', es: 'Una firma', en: 'A single signature' },
  { id: 'sig_monthly', es: 'Firmas — plan mensual', en: 'Signatures — monthly plan' },
  { id: 'quote_single', es: 'Una cotización', en: 'A single quote' },
  { id: 'sub_monthly', es: 'Suscripción mensual', en: 'Monthly subscription' },
  { id: 'sub_annual', es: 'Suscripción anual', en: 'Annual subscription' },
];

const card = 'rounded-3xl border border-slate-200 bg-white p-6 shadow-sm';
const input = 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400';
const label = 'mb-1.5 block text-xs font-semibold text-slate-600';

function cuantoQueda(iso: string | null, es: boolean): string {
  if (!iso) return es ? 'Sin caducidad' : 'No expiry';
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return es ? 'Caducado' : 'Expired';
  const min = Math.round(ms / 60000);
  if (min < 60) return es ? `${min} min` : `${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return es ? `${h} h` : `${h} h`;
  return es ? `${Math.round(h / 24)} días` : `${Math.round(h / 24)} days`;
}

export function BonosYRegalosTab({ language }: { language: 'en' | 'es' }) {
  const es = language === 'es';

  // ── Bonos ──────────────────────────────────────────────────────────
  const [codigos, setCodigos] = useState<PromoCode[]>([]);
  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);
  const [palabra, setPalabra] = useState('');
  const [descuento, setDescuento] = useState(100);
  const [producto, setProducto] = useState('full_access');
  const [duracion, setDuracion] = useState<number | null>(60 * 24);
  const [maxUsos, setMaxUsos] = useState('');
  const [nota, setNota] = useState('');
  const [copiado, setCopiado] = useState<string | null>(null);
  const [planes, setPlanes] = useState<PlanRebajado[]>([]);
  const [creandoPlan, setCreandoPlan] = useState(false);

  // ── Regalos ────────────────────────────────────────────────────────
  const [regalos, setRegalos] = useState<AdminGiftRow[]>([]);
  const [correo, setCorreo] = useState('');
  const [cantidad, setCantidad] = useState(2);
  const [mensaje, setMensaje] = useState('');
  const [regalando, setRegalando] = useState(false);

  const recargar = useCallback(async () => {
    setCargando(true);
    try {
      const [c, g, p] = await Promise.all([listPromoCodes(), listGiftedDocuments(), listarPlanesRebajados()]);
      setCodigos(c);
      setRegalos(g);
      setPlanes(p);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo cargar.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void recargar(); }, [recargar]);

  /** Sólo las suscripciones necesitan un plan aparte, y sólo si el descuento
   *  no es total: un bono del 100% se concede sin pasar por PayPal. */
  const necesitaPlan = descuento < 100 && PRODUCTOS_DE_SUSCRIPCION.includes(producto);
  const planExistente = planes.find((p) => p.product === producto && p.discountPct === descuento);

  const crear = async () => {
    const code = palabra.trim().toUpperCase();
    if (code.length < 3) {
      toast.error(es ? 'La palabra del bono necesita al menos 3 letras.' : 'The coupon word needs at least 3 characters.');
      return;
    }
    setCreando(true);
    try {
      await createPromoCode({
        code,
        product: producto,
        discountPct: descuento,
        durationMinutes: duracion,
        maxRedemptions: maxUsos.trim() ? Number(maxUsos) : null,
        label: nota.trim() || undefined,
      });
      toast.success(es ? `Bono ${code} creado.` : `Coupon ${code} created.`);

      // Un descuento parcial sobre una suscripción necesita además un plan
      // de PayPal con ese precio: el importe de una suscripción vive dentro
      // del plan, no de la orden. Se crea aquí mismo para que el bono quede
      // utilizable, en vez de dejar uno que falla al usarlo.
      if (necesitaPlan) {
        try {
          const r = await crearPlanRebajado(producto, descuento);
          toast.success(es
            ? (r.reused
              ? `Ya existía el plan de PayPal al ${descuento}% ($${r.amount.toFixed(2)}); el bono lo usará.`
              : `Plan de PayPal creado al ${descuento}%: $${r.amount.toFixed(2)}.`)
            : `PayPal plan at ${descuento}%: $${r.amount.toFixed(2)}.`);
        } catch (err) {
          // El bono existe igualmente; lo que falta es el plan. Se dice tal
          // cual para que no parezca que todo salió bien.
          toast.error(es
            ? `El bono se creó, pero el plan de PayPal falló: ${err instanceof Error ? err.message : ''}. Sin ese plan, este bono no funcionará en suscripciones.`
            : `Coupon created, but the PayPal plan failed: ${err instanceof Error ? err.message : ''}`);
        }
      }

      setPalabra(''); setNota(''); setMaxUsos('');
      await recargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear el bono.');
    } finally {
      setCreando(false);
    }
  };

  const alternar = async (c: PromoCode) => {
    try {
      await setPromoCodeActive(c.code, !c.active);
      setCodigos((prev) => prev.map((x) => (x.code === c.code ? { ...x, active: !x.active } : x)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo cambiar.');
    }
  };

  const copiar = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiado(code);
    setTimeout(() => setCopiado(null), 2000);
  };

  const regalar = async () => {
    if (!correo.includes('@')) {
      toast.error(es ? 'Escribe un correo válido.' : 'Enter a valid email.');
      return;
    }
    setRegalando(true);
    try {
      await giftDocuments(correo.trim(), cantidad, mensaje.trim() || undefined);
      toast.success(es
        ? `${cantidad} ${cantidad === 1 ? 'documento regalado' : 'documentos regalados'} a ${correo.trim()}.`
        : `${cantidad} document(s) gifted to ${correo.trim()}.`);
      setCorreo(''); setMensaje('');
      await recargar();
    } catch (err) {
      // El error más común es que ese correo no tenga cuenta; el mensaje viene
      // ya redactado desde la función de base de datos.
      toast.error(err instanceof Error ? err.message : 'No se pudo regalar.');
    } finally {
      setRegalando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ══════════════ BONOS ══════════════ */}
      <div className={card}>
        <p className="mb-1 flex items-center gap-2 text-sm font-bold text-slate-800">
          <Ticket className="size-4 text-indigo-500" />
          {es ? 'Bonos de descuento' : 'Discount coupons'}
        </p>
        <p className="mb-5 text-xs text-slate-500">
          {es
            ? 'Creas una palabra y un porcentaje. No va dirigida a nadie: quien tenga el bono lo escribe al pagar.'
            : 'Create a word and a percentage. It targets nobody: whoever has it types it at checkout.'}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>{es ? 'Palabra del bono' : 'Coupon word'}</label>
            <input
              value={palabra}
              onChange={(e) => setPalabra(e.target.value.toUpperCase())}
              placeholder={es ? 'BONO, BOLA, NAVIDAD…' : 'BONUS, GIFT, XMAS…'}
              className={`${input} font-mono tracking-wider`}
            />
          </div>
          <div>
            <label className={label}>
              <Percent className="mr-1 inline size-3" />
              {es ? 'Descuento' : 'Discount'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range" min={5} max={100} step={5}
                value={descuento}
                onChange={(e) => setDescuento(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-14 shrink-0 text-right text-sm font-black text-indigo-700">{descuento}%</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {descuento === 100
                ? (es ? 'Gratis del todo.' : 'Completely free.')
                : (es ? `La persona paga el ${100 - descuento}% restante.` : `The person pays the remaining ${100 - descuento}%.`)}
            </p>
          </div>
          <div>
            <label className={label}>{es ? 'Qué libera' : 'What it unlocks'}</label>
            <select value={producto} onChange={(e) => setProducto(e.target.value)} className={`${input} bg-white`}>
              {PRODUCTOS.map((p) => <option key={p.id} value={p.id}>{es ? p.es : p.en}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>
              <Clock className="mr-1 inline size-3" />
              {es ? 'Cuánto dura' : 'How long it lasts'}
            </label>
            <select
              value={duracion === null ? 'null' : String(duracion)}
              onChange={(e) => setDuracion(e.target.value === 'null' ? null : Number(e.target.value))}
              className={`${input} bg-white`}
            >
              {DURACIONES.map((d) => (
                <option key={String(d.minutos)} value={d.minutos === null ? 'null' : String(d.minutos)}>
                  {es ? d.es : d.en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>
              <Users className="mr-1 inline size-3" />
              {es ? 'Máximo de usos (opcional)' : 'Max redemptions (optional)'}
            </label>
            <input
              type="number" min={1} value={maxUsos}
              onChange={(e) => setMaxUsos(e.target.value)}
              placeholder={es ? 'Sin límite' : 'No limit'}
              className={input}
            />
          </div>
          <div>
            <label className={label}>{es ? 'Nota interna (opcional)' : 'Internal note (optional)'}</label>
            <input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder={es ? 'Campaña de agosto' : 'August campaign'}
              className={input}
            />
          </div>
        </div>

        {/* Aviso del plan de PayPal. Aparece sólo cuando de verdad hace
            falta: descuento parcial sobre una suscripción. */}
        {necesitaPlan && (
          <div className={`mt-4 rounded-2xl border px-4 py-3 text-xs ${
            planExistente ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}>
            {planExistente ? (
              <p>
                {es
                  ? `Ya existe el plan de PayPal al ${descuento}% (cobra $${planExistente.amount.toFixed(2)}). El bono lo usará automáticamente.`
                  : `A PayPal plan at ${descuento}% already exists (charges $${planExistente.amount.toFixed(2)}). The coupon will use it.`}
              </p>
            ) : (
              <>
                <p className="font-semibold">
                  {es ? 'Este bono necesita un plan de PayPal propio.' : 'This coupon needs its own PayPal plan.'}
                </p>
                <p className="mt-1 leading-relaxed">
                  {es
                    ? 'En una suscripción el importe vive dentro del plan de PayPal, no del cobro, así que no se puede rebajar sobre la marcha. Al crear el bono se creará también el plan con el precio ya rebajado.'
                    : "In a subscription the amount lives inside the PayPal plan, not the order, so it cannot be discounted on the fly. Creating the coupon will also create the discounted plan."}
                </p>
                <button
                  type="button"
                  disabled={creandoPlan}
                  onClick={async () => {
                    setCreandoPlan(true);
                    try {
                      const r = await crearPlanRebajado(producto, descuento);
                      toast.success(es ? `Plan creado: $${r.amount.toFixed(2)}` : `Plan created: $${r.amount.toFixed(2)}`);
                      setPlanes(await listarPlanesRebajados());
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Error');
                    } finally {
                      setCreandoPlan(false);
                    }
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                >
                  {creandoPlan ? <Loader className="size-3 animate-spin" /> : <Plus className="size-3" />}
                  {es ? 'Crear el plan ahora' : 'Create the plan now'}
                </button>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => void crear()}
          disabled={creando}
          className="mt-4 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50"
        >
          {creando ? <Loader className="size-4 animate-spin" /> : <Plus className="size-4" />}
          {es ? 'Crear bono' : 'Create coupon'}
        </button>

        {/* Lista */}
        <div className="mt-6 space-y-2">
          {cargando ? (
            <div className="flex justify-center py-6"><Loader className="size-5 animate-spin text-indigo-500" /></div>
          ) : codigos.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">{es ? 'Aún no hay bonos.' : 'No coupons yet.'}</p>
          ) : codigos.map((c) => (
            <div
              key={c.code}
              className={`flex flex-wrap items-center gap-3 rounded-2xl border p-3 ${
                c.active && !c.expired ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-70'
              }`}
            >
              <button
                type="button"
                onClick={() => void copiar(c.code)}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 font-mono text-xs font-bold tracking-wider text-white"
                title={es ? 'Copiar' : 'Copy'}
              >
                {c.code}
                {copiado === c.code ? <CheckCheck className="size-3" /> : <Copy className="size-3 opacity-60" />}
              </button>

              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700">
                {c.discountPct}%
              </span>

              <span className="text-xs text-slate-500">
                {PRODUCTOS.find((p) => p.id === c.product)?.[es ? 'es' : 'en'] ?? c.product}
              </span>

              <span className={`text-xs ${c.expired ? 'font-semibold text-red-500' : 'text-slate-400'}`}>
                {cuantoQueda(c.expiresAt, es)}
              </span>

              <span className="text-xs text-slate-400">
                {c.redemptionCount}
                {c.maxRedemptions !== null ? ` / ${c.maxRedemptions}` : ''} {es ? 'usos' : 'uses'}
              </span>

              {c.label && <span className="text-xs italic text-slate-400">{c.label}</span>}

              <button
                type="button"
                onClick={() => void alternar(c)}
                className={`ml-auto flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${
                  c.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-500'
                }`}
              >
                <Power className="size-3" />
                {c.active ? (es ? 'Activo' : 'Active') : (es ? 'Apagado' : 'Off')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════ REGALOS ══════════════ */}
      <div className={card}>
        <p className="mb-1 flex items-center gap-2 text-sm font-bold text-slate-800">
          <Gift className="size-4 text-emerald-500" />
          {es ? 'Regalar documentos' : 'Gift documents'}
        </p>
        <p className="mb-5 text-xs text-slate-500">
          {es
            ? 'Va dirigido a una persona por su correo. No hay código que escribir: le aparecen los documentos y le suena un aviso la próxima vez que entre.'
            : 'Targets one person by email. No code to type: the documents appear and a sound plays next time they open the app.'}
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={label}>
              <Mail className="mr-1 inline size-3" />
              {es ? 'Correo de la persona' : "Person's email"}
            </label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="persona@correo.com"
              className={input}
            />
          </div>
          <div>
            <label className={label}>{es ? 'Cuántos documentos' : 'How many documents'}</label>
            <input
              type="number" min={1} max={500}
              value={cantidad}
              onChange={(e) => setCantidad(Math.max(1, Number(e.target.value) || 1))}
              className={input}
            />
          </div>
          <div className="sm:col-span-3">
            <label className={label}>{es ? 'Mensaje para esa persona (opcional)' : 'Message for them (optional)'}</label>
            <input
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder={es ? 'Gracias por confiar en nosotros' : 'Thanks for trusting us'}
              className={input}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => void regalar()}
          disabled={regalando}
          className="mt-4 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50"
        >
          {regalando ? <Loader className="size-4 animate-spin" /> : <Gift className="size-4" />}
          {es ? 'Regalar' : 'Send gift'}
        </button>

        <div className="mt-6 space-y-2">
          {regalos.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">{es ? 'Aún no has regalado nada.' : 'Nothing gifted yet.'}</p>
          ) : regalos.map((g) => (
            <div key={g.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 p-3">
              <span className="text-xs font-semibold text-slate-700">{g.email}</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                {g.quantity} {es ? 'docs' : 'docs'}
              </span>
              <span className="text-xs text-slate-400">
                {es ? `${g.remaining} sin usar` : `${g.remaining} unused`}
              </span>
              <span className="text-xs text-slate-400">
                {g.notifiedAt
                  ? (es ? 'Ya avisado' : 'Notified')
                  : (es ? 'Pendiente de aviso' : 'Not notified yet')}
              </span>
              {g.message && <span className="text-xs italic text-slate-400">«{g.message}»</span>}
              <span className="ml-auto text-[11px] text-slate-300">
                {new Date(g.createdAt).toLocaleDateString(es ? 'es-ES' : 'en-US')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
