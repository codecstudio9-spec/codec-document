import type { CSSProperties } from 'react';

/**
 * Lenguaje visual del panel para contadores (Colombia).
 *
 * ── Por qué un archivo aparte de mobile-theme ───────────────────────────
 * Esta herramienta es otro producto dentro del mismo dominio: sólo Colombia,
 * sólo contadores, con su propia pasarela de pago. Comparte la marca pero no
 * el recorrido: aquí no se firman documentos, se procesan miles de XML. Un
 * panel de trabajo necesita densidad y jerarquía distintas de las de una app
 * móvil de firma, y mezclarlos en el mismo archivo terminaría con tokens que
 * sólo valen para la mitad de las pantallas.
 *
 * Se reutilizan los valores de marca (azul, radios, sombras) para que siga
 * pareciendo Codec Document.
 *
 * ── Qué se busca ────────────────────────────────────────────────────────
 * Que un contador que paga $129.000 al mes sienta que abrió una herramienta
 * seria. Eso es profundidad y quietud, no adornos: fondos con capas en vez de
 * un relleno plano, relieve suave en lo que se pulsa, y movimiento sólo donde
 * comunica algo. Una animación que no explica nada distrae, y esta gente pasa
 * horas aquí.
 */

// ── Superficies ───────────────────────────────────────────────────────────

/** Barra lateral, en el azul de la marca.
 *
 *  Se probó oscura y el resultado fue peor: un panel casi negro al lado de un
 *  área blanca parte la pantalla en dos productos distintos y el contador
 *  tarda en entender que es una sola herramienta. El azul mantiene la
 *  jerarquía sin ese corte. */
export const SIDEBAR_BG =
  'linear-gradient(180deg, #1D4ED8 0%, #1E51DD 45%, #1A44C4 100%)';

/** Franja de bienvenida, arriba del área de trabajo. Continúa el azul de la
 *  barra para que ambas se lean como un mismo marco. */
export const BANNER_BG =
  'linear-gradient(100deg, #1D4ED8 0%, #2563EB 55%, #3B82F6 100%)';

/** Fondo del área de trabajo: casi blanco.
 *
 *  El degradado tiene apenas dos puntos de diferencia entre extremos. Sirve
 *  para que las tarjetas blancas no floten sobre un plano idéntico al suyo,
 *  pero sin teñir la pantalla. Aquí el blanco es la superficie de trabajo, no
 *  el acento. */
export const WORKSPACE_BG = 'linear-gradient(180deg, #FBFCFE 0%, #F4F7FC 100%)';

/** Tarjeta estándar. La sombra va en dos capas —una corta y densa, otra
 *  larga y difusa— porque una sola sombra grande se ve como una mancha.
 *
 *  Sobre un fondo casi blanco la sombra tiene que ser MÁS suave, no más
 *  fuerte: en cuanto se nota el gris, la tarjeta parece sucia en vez de
 *  elevada. El relieve lo da el borde claro, no la sombra. */
export const CARD: CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)',
  border: '1px solid #E8EDF5',
};

/** Tarjeta destacada, para lo que hay que mirar primero. */
export const CARD_ALZADA: CSSProperties = {
  ...CARD,
  boxShadow: '0 2px 4px rgba(15,23,42,0.05), 0 20px 48px rgba(15,23,42,0.11)',
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
