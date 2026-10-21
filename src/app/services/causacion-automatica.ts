/**
 * Causación automática: los XML que llegan a una empresa se contabilizan
 * solos, sin abrir el panel de causación.
 *
 * ── Qué causa sola y qué no ─────────────────────────────────────────────
 * Sólo lo que el contador ya decidió alguna vez:
 *   · la empresa tiene sus cuentas guardadas (la primera causación a mano);
 *   · cada proveedor tiene su cuenta confirmada (lo que se aprende al causar).
 * Las ventas siempre se pueden causar (van a la cuenta de ingresos). Un
 * proveedor nuevo, un documento que el motor marca «revisar» o uno que
 * requiere revisión del XML se quedan «por causar», y se le dice cuántos y
 * por qué. Es lo que hace un auxiliar contable bueno: lo repetido lo hace
 * solo, lo nuevo lo pregunta.
 *
 * ── Sin IA en las cifras ────────────────────────────────────────────────
 * El asiento sale del mismo motor determinista (lib/dian/causacion.ts) que
 * usa el panel. Un modelo de lenguaje se equivoca en números.
 */

import {
  CUENTAS_POR_DEFECTO, causar, rolDelDocumento, type DocCausable, type ReglaTercero,
} from '../../lib/dian/causacion';
import { toast } from 'sonner';
import { obtenerConfigCausacion, listarReglasCausacion } from './dian-service';
import { datosCausacionEmpresa, contabilizarCausacion, type Empresa } from './contabilidad-service';

export interface ResultadoAutomatico {
  empresa: string;
  /** La empresa todavía no tiene cuentas guardadas: falta la primera vez a mano. */
  sinConfigurar: boolean;
  causados: number;
  proveedoresNuevos: number;
  porRevisar: number;
}

export async function causarAutomaticamente(empresa: Empresa): Promise<ResultadoAutomatico> {
  const nombre = empresa.nombre_comercial || empresa.razon_social;
  const base: ResultadoAutomatico = { empresa: nombre, sinConfigurar: false, causados: 0, proveedoresNuevos: 0, porRevisar: 0 };

  const config = await obtenerConfigCausacion(empresa.nit);
  if (!config) return { ...base, sinConfigurar: true };
  const cuentas = { ...CUENTAS_POR_DEFECTO, ...config.cuentas };
  const reglas = new Map<string, ReglaTercero>((await listarReglasCausacion(empresa.nit)).map((r) => [r.tercero_nit, r]));

  const { documentos } = await datosCausacionEmpresa(empresa);
  const pendientes = (documentos as Array<DocCausable & { accounting_status?: string }>)
    .filter((d) => d.accounting_status === 'pendiente');

  const listos: DocCausable[] = [];
  const nuevos = new Set<string>();
  let porRevisar = 0;
  for (const d of pendientes) {
    const rol = rolDelDocumento(d, empresa.nit);
    if (!rol) continue;
    if (d.status && d.status !== 'PROCESSED') { porRevisar++; continue; }
    if (rol.rol === 'compra' && !reglas.get(rol.terceroNit)?.cuenta) { nuevos.add(rol.terceroNit); continue; }
    listos.push(d);
  }
  if (listos.length === 0) return { ...base, proveedoresNuevos: nuevos.size, porRevisar };

  const resultado = causar(listos, empresa.nit, cuentas, reglas);
  // Lo que el motor no pudo decidir solo no se contabiliza a ciegas.
  const dudosos = new Set(resultado.avisos.filter((a) => a.nivel === 'revisar' && a.documentoId).map((a) => a.documentoId!));
  const limpio = {
    ...resultado,
    movimientos: resultado.movimientos.filter((m) => !dudosos.has(m.documentoId)),
  };
  const r = await contabilizarCausacion(empresa.id, limpio);
  return {
    ...base,
    causados: r.nuevos,
    proveedoresNuevos: nuevos.size,
    porRevisar: porRevisar + dudosos.size + r.errores.length,
  };
}

/** Todas las empresas activas que la tienen encendida, una tras otra. */
export async function causarEmpresasAutomaticamente(empresas: Empresa[]): Promise<ResultadoAutomatico[]> {
  const salida: ResultadoAutomatico[] = [];
  for (const e of empresas.filter((x) => x.activo && x.causacion_automatica !== false)) {
    try { salida.push(await causarAutomaticamente(e)); } catch (err) { console.warn('[causación automática]', e.razon_social, err); }
  }
  return salida;
}

/** Resume en un aviso lo que la causación automática hizo y lo que dejó. */
export function avisarCausacion(res: ResultadoAutomatico[]) {
  const causados = res.reduce((v, r) => v + r.causados, 0);
  const nuevos = res.reduce((v, r) => v + r.proveedoresNuevos, 0);
  const revisar = res.reduce((v, r) => v + r.porRevisar, 0);
  if (causados > 0) {
    const donde = res.filter((r) => r.causados > 0).map((r) => `${r.empresa}: ${r.causados}`).slice(0, 3).join(' · ');
    toast.success(`Causé solas ${causados} ${causados === 1 ? 'factura' : 'facturas'} (${donde})`, {
      description: nuevos + revisar > 0
        ? `Te esperan ${nuevos} ${nuevos === 1 ? 'proveedor nuevo' : 'proveedores nuevos'}${revisar ? ` y ${revisar} por revisar` : ''} en «Causar XML».`
        : undefined,
      duration: 9000,
    });
  } else if (nuevos > 0) {
    toast.message(`Hay ${nuevos} ${nuevos === 1 ? 'proveedor nuevo' : 'proveedores nuevos'} por causar`, {
      description: 'Cáusalos una vez en «Causar XML» y desde ahí sus facturas se causan solas.',
      duration: 9000,
    });
  }
}

