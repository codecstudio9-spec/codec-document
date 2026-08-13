/**
 * El sonido de Codec Document.
 *
 * ── Por qué sintetizado y no un mp3 ─────────────────────────────────────
 * Un archivo de audio son 20-40 KB que hay que descargar, cachear y servir, y
 * que además hay que tener: no existe ninguno de la marca. Esto son unos pocos
 * cientos de bytes de código, suena idéntico en todos los navegadores porque
 * no depende de ningún códec, y se puede afinar cambiando dos números.
 *
 * ── Cómo suena y por qué ────────────────────────────────────────────────
 * Dos notas que suben, un intervalo de quinta justa (La4 → Mi5), con un
 * ataque muy corto y una cola suave. Subir se lee como «algo bueno terminó»;
 * la misma pareja al revés suena a error, que no es lo que queremos anunciar
 * cuando un pago entra o una importación acaba.
 *
 * Dura 320 ms en total. Un aviso más largo empieza a molestar a la tercera
 * vez, y esta gente pasa horas con la aplicación abierta.
 *
 * ── Silencio por defecto en los navegadores ─────────────────────────────
 * Ningún navegador deja sonar nada hasta que el usuario haya interactuado con
 * la página. No es un problema que haya que resolver: si el contador todavía
 * no ha tocado nada, tampoco ha lanzado ninguna acción que merezca aviso. Se
 * captura el fallo y se sigue, sin romper nada.
 */

/** Frecuencias en Hz. La4 y Mi5. */
const NOTAS = [440, 659.25];

/** Cuánto dura cada nota y cuánto se separan, en segundos. */
const DURACION = 0.22;
const SEPARACION = 0.1;

let contexto: AudioContext | null = null;

function obtenerContexto(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;

  // Uno solo para toda la sesión: crear un AudioContext por aviso agota el
  // límite del navegador (Chrome corta sobre los seis) y a partir de ahí no
  // suena nada más.
  if (!contexto) contexto = new Ctor();
  return contexto;
}

/**
 * Suena el aviso. No lanza nunca: un aviso que falla no puede tumbar la acción
 * que lo produjo.
 */
export function sonarAvisoCodec(): void {
  try {
    const ctx = obtenerContexto();
    if (!ctx) return;

    // Si el navegador lo dejó suspendido por falta de interacción, se intenta
    // reanudar. Si tampoco se puede, no pasa nada.
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});

    const ahora = ctx.currentTime;

    NOTAS.forEach((frecuencia, i) => {
      const inicio = ahora + i * SEPARACION;
      const fin = inicio + DURACION;

      const oscilador = ctx.createOscillator();
      // Triangular: tiene armónicos suficientes para oírse sobre el ruido de
      // una oficina, pero sin el filo de la cuadrada o la sierra, que en un
      // aviso repetido cansan enseguida.
      oscilador.type = 'triangle';
      oscilador.frequency.value = frecuencia;

      const volumen = ctx.createGain();
      // Rampas en vez de saltos: un cambio instantáneo de volumen produce un
      // chasquido audible al principio y al final de cada nota.
      volumen.gain.setValueAtTime(0, inicio);
      volumen.gain.linearRampToValueAtTime(0.16, inicio + 0.015);
      volumen.gain.exponentialRampToValueAtTime(0.0001, fin);

      oscilador.connect(volumen).connect(ctx.destination);
      oscilador.start(inicio);
      oscilador.stop(fin + 0.02);
    });
  } catch {
    // Sin sonido. El aviso visual ya está dado.
  }
}
