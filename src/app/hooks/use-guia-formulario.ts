/**
 * La guía por voz de cualquier formulario de Codec Document.
 *
 * Vive en un hook y no dentro de cada pantalla porque el comportamiento tiene
 * que ser el mismo en los tres formularios del producto —plantillas propias,
 * plantillas de Word y cotizaciones— y lo que cambia entre ellos son sólo las
 * palabras. Escrito una vez por pantalla, acabarían diciendo cosas distintas
 * de la misma función.
 *
 * Hace dos cosas:
 *
 * 1. **Presenta el documento y el dictado.** Dice qué se está llenando y
 *    cuántos campos tiene, y acto seguido que se puede dictar entero. Es la
 *    función que más tiempo ahorra y la que menos se descubre sola: un botón
 *    en pantalla se pasa por alto, una frase hablada no.
 *
 * 2. **Sigue al usuario por las secciones.** Al llegar a una nueva corta lo
 *    que estaba diciendo y explica ésa. Antes narraba una sola vez al abrir y
 *    ahí se quedaba, así que quien bajaba seguía oyendo la bienvenida.
 *
 * Nada de esto suena si el usuario tiene la guía apagada: `speak()` no hace
 * nada en ese caso, así que no hay que consultar su estado en cada llamada.
 */

import { useEffect, useRef } from 'react';
import { useVoiceSpeak } from './useVoiceGuide';

export interface GuionSeccion {
  es: string;
  en: string;
}

export interface OpcionesGuia {
  /** Qué se está llenando: «Carta de Renuncia», «Contrato de Franquicia»… */
  nombreDocumento: string;
  /** Cuántos campos tiene. Concreta la promesa del dictado. */
  cuantosCampos: number;
  /**
   * Si esta cuenta ya puede usar el dictado con IA.
   *
   * Cambia la frase entera, no un matiz: a quien ya lo tiene se le dice cómo
   * usarlo, y a quien no, qué ganaría. Decirle «si tienes plan premium» a
   * alguien que lo tiene suena a que el producto no sabe quién es.
   */
  tienePremium: boolean;
  /**
   * Qué decir en cada sección, indexado por el valor de `data-seccion-voz`.
   * Si no se pasa nada, sólo suena la presentación.
   */
  secciones?: Record<string, GuionSeccion>;
  /** Se apaga cuando el formulario no está a la vista (otro paso del flujo). */
  activo?: boolean;
  /**
   * Si se menciona el dictado.
   *
   * En el enlace público lo rellena un invitado sin sesión, y ahí el dictado
   * con IA devolvería «necesitas iniciar sesión». Ofrecérselo sería prometer
   * algo que no va a funcionar, y encima venderle un plan a alguien que sólo
   * vino a llenar el formulario de otra persona.
   */
  mencionarDictado?: boolean;
}

export function useGuiaFormulario({
  nombreDocumento,
  cuantosCampos,
  tienePremium,
  secciones,
  activo = true,
  mencionarDictado = true,
}: OpcionesGuia) {
  const { speak } = useVoiceSpeak();

  // ── Presentación ────────────────────────────────────────────────────────
  // Una sola vez por documento. Si dependiera del render, se repetiría en cada
  // pulsación de tecla del formulario.
  const presentado = useRef<string>('');
  useEffect(() => {
    if (!activo || !nombreDocumento) return;
    if (presentado.current === nombreDocumento) return;
    presentado.current = nombreDocumento;

    const campos = cuantosCampos > 0
      ? { es: ` Tiene ${cuantosCampos} campos.`, en: ` It has ${cuantosCampos} fields.` }
      : { es: '', en: '' };

    const dictado = !mencionarDictado
      ? { es: ' Completa los campos y continúa.', en: ' Fill in the fields and continue.' }
      : tienePremium
      ? {
          es: ' Para ahorrarte escribirlos, pulsa el botón azul que dice «Dicta el documento» y cuéntame los datos en voz alta: la inteligencia artificial los reparte en los campos por ti, y antes de aplicar nada te muestro qué entendí para que lo revises.',
          en: ' To save yourself the typing, press the blue button that says "Dictate the document" and tell me the details out loud: the AI spreads them across the fields for you, and before applying anything it shows you what it understood so you can check it.',
        }
      : {
          es: ' Con el plan premium puedes dictar el formulario completo en voz alta y la inteligencia artificial lo rellena por ti, en vez de escribir campo por campo.',
          en: ' With the premium plan you can dictate the whole form out loud and the AI fills it in for you, instead of typing field by field.',
        };

    speak({
      es: `Estás llenando ${nombreDocumento}.${campos.es}${dictado.es}`,
      en: `You are filling in ${nombreDocumento}.${campos.en}${dictado.en}`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, nombreDocumento, tienePremium, mencionarDictado]);

  // ── Secciones ───────────────────────────────────────────────────────────
  const seccionNarrada = useRef<string>('');
  useEffect(() => {
    if (!activo || !secciones) return;

    const tarjetas = Array.from(document.querySelectorAll<HTMLElement>('[data-seccion-voz]'));
    if (tarjetas.length === 0) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        // La sección «actual» es la MÁS visible, no la primera que asome: con
        // tarjetas altas, dos pueden estar a la vez tocando el borde.
        const visible = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;

        const clave = visible.target.getAttribute('data-seccion-voz') ?? '';
        // Sólo al CAMBIAR de sección. Un desplazamiento que oscile entre dos
        // tarjetas repetiría la frase sin parar.
        if (!clave || clave === seccionNarrada.current) return;
        seccionNarrada.current = clave;

        const guion = secciones[clave];
        if (guion) speak(guion);
      },
      // Umbrales escalonados para poder comparar cuál se ve más, y un margen
      // que descarta lo que apenas asoma por el borde inferior.
      { threshold: [0.25, 0.5, 0.75], rootMargin: '-15% 0px -35% 0px' },
    );

    tarjetas.forEach((t) => observador.observe(t));
    return () => observador.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, secciones]);
}
