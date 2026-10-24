import { supabase } from '../../lib/supabase';

/**
 * Planes de Contadores: una sola suscripción por cuenta, con una fecha de
 * corte. Todas las cifras (cuánto se paga hoy, hasta cuándo, por cuánto
 * renueva) las calcula la base con contador_calcular: la pantalla sólo las
 * muestra, así nunca dice algo distinto de lo que se va a cobrar.
 */

export type Modulo = 'xml' | 'contador';
export type Tamano = 'independiente' | 'oficina' | 'firma';
export type Ciclo = 'mensual' | 'anual';

export interface PlanCatalogo {
  code: string;
  modulo: Modulo;
  tamano: Tamano;
  nombre: string;
  descripcion: string | null;
  xml_mes: number;
  max_empresas: number;
  precio_mes: number;
  precio_anual: number;
}

export interface EstadoPlan {
  admin: boolean;
  activo: boolean;
  enPrueba: boolean;
  contabilidad: boolean;
  plan: { code: string; nombre: string; modulo: Modulo | 'prueba'; tamano: Tamano | null; xml_mes: number; max_empresas: number } | null;
  ciclo: Ciclo | null;
  hasta: string | null;
  precioEspecial: number | null;
  renuevaPor: number | null;
  programado: { plan: string; nombre: string; ciclo: Ciclo; desde: string; hasta: string } | null;
  vencido: boolean;
  vencioEl: string | null;
  pruebaDisponible: boolean;
  maxEmpresas: number | null;
  empresasUsadas: number;
  planes: PlanCatalogo[];
}

export interface Cotizacion {
  tipo: 'nuevo' | 'renovacion' | 'mejora' | 'cambio_anual' | 'programado';
  plan: string;
  plan_nombre: string;
  modulo: Modulo;
  ciclo: Ciclo;
  precio_lista: number;
  hoy: number;
  desde: string;
  hasta: string;
  renueva_por: number;
  precio_especial: boolean;
  actual: { plan: string; plan_nombre: string; ciclo: Ciclo; pagado: number; hasta: string } | null;
}

export async function estadoPlan(): Promise<EstadoPlan> {
  const { data, error } = await supabase.rpc('contador_estado');
  if (error) throw new Error(error.message);
  const d = (data ?? {}) as Record<string, any>;
  return {
    admin: Boolean(d.admin),
    activo: Boolean(d.activo),
    enPrueba: Boolean(d.en_prueba),
    contabilidad: Boolean(d.contabilidad),
    plan: d.plan ?? null,
    ciclo: d.ciclo ?? null,
    hasta: d.hasta ?? null,
    precioEspecial: d.precio_especial ?? null,
    renuevaPor: d.renueva_por ?? null,
    programado: d.programado ?? null,
    vencido: Boolean(d.vencido),
    vencioEl: d.vencio_el ?? null,
    pruebaDisponible: Boolean(d.prueba_disponible),
    maxEmpresas: d.max_empresas ?? null,
    empresasUsadas: Number(d.empresas_usadas ?? 0),
    planes: (d.planes ?? []) as PlanCatalogo[],
  };
}

export async function cotizar(plan: string, ciclo: Ciclo): Promise<Cotizacion> {
  const { data, error } = await supabase.rpc('contador_cotizar', { p_plan: plan, p_ciclo: ciclo });
  if (error) throw new Error(error.message);
  return data as Cotizacion;
}

export async function iniciarPruebaContador(): Promise<EstadoPlan> {
  const { error } = await supabase.rpc('contador_iniciar_prueba');
  if (error) throw new Error(error.message);
  return estadoPlan();
}

/** Abre el cobro y devuelve la URL del checkout de Wompi. El importe lo pone la base. */
export async function pagarPlan(plan: string, ciclo: Ciclo): Promise<string> {
  const { data, error } = await supabase.functions.invoke('wompi-checkout', {
    body: { producto: 'contador', plan, ciclo },
  });
  if (error) throw new Error(error.message);
  const c = data as {
    publicKey: string; reference: string; amountInCents: number; currency: string;
    signature: string; redirectUrl: string; email?: string; error?: string;
  };
  if (c?.error) throw new Error(c.error);
  if (!c?.signature) throw new Error('No se pudo abrir el cobro.');
  const q = new URLSearchParams({
    'public-key': c.publicKey,
    currency: c.currency,
    'amount-in-cents': String(c.amountInCents),
    reference: c.reference,
    'signature:integrity': c.signature,
    'redirect-url': c.redirectUrl,
  });
  if (c.email) q.set('customer-data:email', c.email);
  return `https://checkout.wompi.co/p/?${q.toString()}`;
}

/** Cuándo se registró el último pago aprobado; sirve para confirmar la vuelta de Wompi. */
export async function ultimoPago(): Promise<string | null> {
  const { data } = await supabase.from('contador_suscripciones').select('last_payment_at').maybeSingle();
  return (data?.last_payment_at as string | null) ?? null;
}

export const pesos = (v: number) => v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export const fechaLarga = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' });

/** El tamaño que le queda a quien ya tiene tantas empresas. */
export function tamanoPara(empresas: number): Tamano {
  return empresas <= 30 ? 'independiente' : empresas <= 60 ? 'oficina' : 'firma';
}
