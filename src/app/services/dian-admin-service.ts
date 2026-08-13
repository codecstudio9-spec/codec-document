/**
 * Panel de control del dueño para la herramienta de contadores.
 *
 * Va aparte de dian-service.ts a propósito: eso es lo que usa el contador y
 * esto es lo que ve sólo el dueño. Separarlos deja claro de un vistazo qué
 * superficie es pública y cuál no, y evita que una función de administración
 * acabe importada por accidente en una pantalla de cliente.
 *
 * Ninguna de estas llamadas es un guardia de seguridad: todas las funciones
 * SQL comprueban is_admin_user() por su cuenta. Si alguien llamara a estas
 * desde la consola del navegador con otra sesión, la base le responde
 * «No autorizado».
 */

import { supabase } from '../../lib/supabase';

export interface ResumenAdmin {
  usuariosTotal: number;
  usuariosMes: number;
  dePago: number;
  docsMes: number;
  docsTotal: number;
  ingresosMes: number;
  ingresosTotal: number;
  pagosPendientes: number;
  documentosGuardados: number;
}

export interface UsuarioAdmin {
  userId: string;
  email: string;
  registrado: string | null;
  ultimoAcceso: string | null;
  planCode: string;
  planNombre: string;
  planHasta: string | null;
  docsMes: number;
  docsTotal: number;
  pagadoTotal: number;
  ultimoPago: string | null;
  ultimaActividad: string | null;
}

export interface PagoAdmin {
  reference: string;
  email: string;
  planCode: string | null;
  cop: number;
  status: string;
  metodo: string;
  manual: boolean;
  creado: string;
}

export async function resumenAdmin(): Promise<ResumenAdmin> {
  const { data, error } = await supabase.rpc('ed_admin_resumen');
  if (error) throw new Error(error.message);
  const d = (data ?? {}) as Record<string, unknown>;
  return {
    usuariosTotal: Number(d.usuarios_total ?? 0),
    usuariosMes: Number(d.usuarios_mes ?? 0),
    dePago: Number(d.de_pago ?? 0),
    docsMes: Number(d.docs_mes ?? 0),
    docsTotal: Number(d.docs_total ?? 0),
    ingresosMes: Number(d.ingresos_mes ?? 0),
    ingresosTotal: Number(d.ingresos_total ?? 0),
    pagosPendientes: Number(d.pagos_pendientes ?? 0),
    documentosGuardados: Number(d.documentos_guardados ?? 0),
  };
}

export async function usuariosAdmin(limite = 200): Promise<UsuarioAdmin[]> {
  const { data, error } = await supabase.rpc('ed_admin_usuarios', { p_limit: limite });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    userId: String(r.user_id),
    email: String(r.email ?? ''),
    registrado: (r.registrado as string) ?? null,
    ultimoAcceso: (r.ultimo_acceso as string) ?? null,
    planCode: String(r.plan_code ?? 'gratis'),
    planNombre: String(r.plan_nombre ?? 'Gratis'),
    planHasta: (r.plan_hasta as string) ?? null,
    docsMes: Number(r.docs_mes ?? 0),
    docsTotal: Number(r.docs_total ?? 0),
    pagadoTotal: Number(r.pagado_total ?? 0),
    ultimoPago: (r.ultimo_pago as string) ?? null,
    ultimaActividad: (r.ultima_actividad as string) ?? null,
  }));
}

export async function pagosAdmin(limite = 100): Promise<PagoAdmin[]> {
  const { data, error } = await supabase.rpc('ed_admin_pagos', { p_limit: limite });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    reference: String(r.reference),
    email: String(r.email ?? ''),
    planCode: (r.plan_code as string) ?? null,
    cop: Number(r.cop ?? 0),
    status: String(r.status),
    metodo: String(r.metodo ?? '—'),
    manual: Boolean(r.manual),
    creado: String(r.creado),
  }));
}

/** Concede un plan sin cobrar. El tiempo se suma a lo que ya tenga. */
export async function concederPlan(
  email: string, planCode: string, meses: number, nota?: string,
): Promise<{ email: string; plan: string; hasta: string }> {
  const { data, error } = await supabase.rpc('ed_admin_conceder_plan', {
    p_email: email, p_plan_code: planCode, p_meses: meses, p_nota: nota ?? null,
  });
  if (error) throw new Error(error.message);
  const d = (data ?? {}) as Record<string, unknown>;
  return { email: String(d.email), plan: String(d.plan), hasta: String(d.hasta) };
}

export async function retirarPlan(email: string): Promise<void> {
  const { error } = await supabase.rpc('ed_admin_retirar_plan', { p_email: email });
  if (error) throw new Error(error.message);
}
