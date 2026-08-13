import type { CSSProperties } from 'react';
import { CARD_RADIUS, CARD_SHADOW } from './mobile-theme';

/**
 * Lenguaje visual del panel para contadores (Colombia).
 *
 * ── Este archivo NO define un estilo propio ─────────────────────────────
 * Lo intentó y fue un error. Durante un tiempo el panel del contador tuvo su
 * propia paleta —barra azul saturada, franja azul de bienvenida, tarjetas de
 * radio 16— y el resultado era que entrar aquí desde el dashboard principal
 * se sentía como salir a otro producto. Es el mismo Codec Document y la misma
 * cuenta: tiene que verse igual.
 *
 * Así que las superficies vienen de `mobile-theme` (fondo, radios, sombras,
 * degradados de marca), que es lo que usa `DesktopAppShell` en `/dashboard/*`.
 * Aquí sólo queda lo que de verdad es exclusivo del contador: el color por
 * estado fiscal, las curvas de movimiento y los botones con relieve.
 *
 * Si algo de aquí empieza a hacer falta en el dashboard principal, se sube a
 * `mobile-theme` — no se copia.
 */

export {
  MOBILE_BG_GRADIENT as FONDO_APP,
  GLOW_TOP_RIGHT as RESPLANDOR_DERECHA,
  GLOW_TOP_LEFT as RESPLANDOR_IZQUIERDA,
  BLUE_GRADIENT as DEGRADADO_MARCA,
  CARD_RADIUS,
  CARD_SHADOW,
} from './mobile-theme';

/** Ancho de la barra lateral. El mismo 280 que `DesktopAppShell`: si las dos
 *  barras del producto midieran distinto, pasar de una pantalla a otra
 *  desplazaría el contenido de lado. */
export const ANCHO_LATERAL = 280;

/** Ancho plegado: sólo los iconos.
 *
 *  76 y no menos porque el icono mide 18, la pastilla del activo necesita
 *  respirar a los lados, y por debajo de eso el objetivo de pulsación queda
 *  más estrecho de lo que cualquiera acierta al primer intento. */
export const ANCHO_LATERAL_PLEGADA = 76;

// ── Superficies ───────────────────────────────────────────────────────────

/**
 * Tarjeta estándar. Es literalmente la del dashboard principal: radio 24 y
 * una sombra larga y muy suave.
 *
 * Sin borde a propósito. El dashboard no lo lleva, y sobre el fondo lavanda
 * la sombra sola ya despega la tarjeta; añadirle un borde gris la ensucia.
 */
export const CARD: CSSProperties = {
  background: '#FFFFFF',
  borderRadius: CARD_RADIUS,
  boxShadow: CARD_SHADOW,
};

/** Tarjeta destacada, para lo que hay que mirar primero. */
export const CARD_ALZADA: CSSProperties = {
  ...CARD,
  boxShadow: '0 24px 56px rgba(15,23,42,0.13)',
};

/** Superficie esmerilada: barra lateral y cabecera, nada más. Es la regla del
 *  dashboard principal, y el motivo es que el efecto sólo se lee como
 *  «premium» mientras siga siendo raro. */
export const CRISTAL: CSSProperties = {
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

// ── Botones con relieve ───────────────────────────────────────────────────

/**
 * Relieve de verdad: luz arriba, sombra propia abajo y contacto con el suelo.
 * Lo que da la sensación de volumen es el `inset` superior claro, no la
 * sombra exterior — sin él queda una pastilla plana con una sombra pegada.
 */
export function boton3D(desde: string, hasta: string, sombra: string): CSSProperties {
  return {
    background: `linear-gradient(180deg, ${desde} 0%, ${hasta} 100%)`,
    boxShadow:
      `inset 0 1px 0 rgba(255,255,255,0.28),`
      + `inset 0 -1px 0 rgba(0,0,0,0.12),`
      + `0 1px 2px rgba(15,23,42,0.10),`
      + `0 8px 20px ${sombra}`,
    border: '1px solid rgba(0,0,0,0.06)',
  };
}

export const BOTON_PRIMARIO = boton3D('#3B82F6', '#1D4ED8', 'rgba(37,99,235,0.35)');
export const BOTON_EXITO = boton3D('#10B981', '#059669', 'rgba(16,185,129,0.32)');
export const BOTON_CORREO = boton3D('#38BDF8', '#0284C7', 'rgba(2,132,199,0.32)');
export const BOTON_PLANTILLA = boton3D('#A855F7', '#7C3AED', 'rgba(124,58,237,0.32)');

/** Botón neutro: mismo relieve, sin color de marca. Para acciones que no
 *  deben competir por la atención. */
export const BOTON_NEUTRO: CSSProperties = {
  background: 'linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)',
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 2px rgba(15,23,42,0.06), 0 6px 14px rgba(15,23,42,0.06)',
  border: '1px solid rgba(15,23,42,0.08)',
};

/**
 * Acciones rápidas de la fila principal, con el mismo relieve que el botón
 * DIAN del dashboard: degradado con el punto claro FUERA del centro, luz
 * interior arriba, línea oscura abajo y sombra proyectada del propio color.
 *
 * Los cuatro `inset` son lo que separa esto de un rectángulo de color. Un
 * degradado a secas, por bonito que sea, se lee plano.
 */
export function accionRelieve(base: string, claro: string, rgbSombra: string): CSSProperties {
  return {
    background: `linear-gradient(135deg, ${base} 0%, ${claro} 45%, ${base} 72%, ${base} 100%)`,
    boxShadow:
      `0 14px 30px rgba(${rgbSombra},0.40),`
      + `inset 0 1px 0 rgba(255,255,255,0.35),`
      + `inset 0 -2px 0 rgba(0,0,0,0.20)`,
  };
}

/** Al pulsar: se hunde. 1px basta — más parece que el botón se rompe. */
export const PULSACION = { scale: 0.985, y: 1 };

// ── Movimiento ────────────────────────────────────────────────────────────

/**
 * Curvas y tiempos únicos para toda la herramienta.
 *
 * `suave` es la de casi todo. `entrada` tiene un punto de rebote mínimo para
 * lo que APARECE (tarjetas, paneles); usarla en lo que ya está en pantalla da
 * sensación de inestabilidad.
 */
export const MOV = {
  suave: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
  entrada: { duration: 0.38, ease: [0.16, 1, 0.3, 1] as const },
  lenta: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

/** Aparición escalonada de una lista. El retraso se corta a los 6 elementos:
 *  con una tabla de 500 filas, escalonar todas tardaría medio minuto. */
export const aparecer = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { ...MOV.entrada, delay: Math.min(i, 6) * 0.045 },
});

// ── Color por estado ──────────────────────────────────────────────────────

/** Un solo sitio donde se decide qué color significa qué. Repartido por las
 *  pantallas terminaría con «revisión» en ámbar en un lado y naranja en otro. */
export const ESTADO = {
  ok: { texto: '#047857', fondo: '#ECFDF5', borde: '#A7F3D0', trazo: '#10B981' },
  revision: { texto: '#B45309', fondo: '#FFFBEB', borde: '#FDE68A', trazo: '#F59E0B' },
  error: { texto: '#BE123C', fondo: '#FFF1F2', borde: '#FECDD3', trazo: '#F43F5E' },
  neutro: { texto: '#475569', fondo: '#F8FAFC', borde: '#E2E8F0', trazo: '#94A3B8' },
} as const;
