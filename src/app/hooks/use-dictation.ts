/**
 * Dictado por voz para los campos de los formularios.
 *
 * Es lo contrario del asistente de voz que ya existe: aquél habla
 * (SpeechSynthesis), éste escucha (SpeechRecognition). Son dos APIs distintas
 * del navegador y no comparten nada, así que este hook vive aparte.
 *
 * Soporte real: Chrome, Edge y Safari lo tienen (Safari sólo con el prefijo
 * `webkit`). Firefox NO. Por eso `soportado` se expone y el botón de micrófono
 * simplemente no se pinta donde no funciona — es mucho mejor que pintarlo y
 * que al pulsarlo no pase nada.
 *
 * Dos comportamientos del navegador que hay que domar:
 *
 * 1. Chrome corta el reconocimiento solo tras unos segundos de silencio,
 *    incluso con `continuous = true`. Quien dicta una carta se detiene a
 *    pensar, y si el micrófono se apaga en esa pausa la experiencia se rompe.
 *    Por eso se reanuda automáticamente mientras el usuario no haya pulsado
 *    detener.
 * 2. Los resultados llegan en dos formas: provisionales (van cambiando
 *    mientras hablas) y finales (ya no cambian). Se acumulan sólo los
 *    finales; los provisionales se muestran aparte para que se vea que el
 *    micrófono está vivo, pero nunca se guardan en el campo.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// La API no está en los tipos de TypeScript del DOM, así que se declara lo
// mínimo que se usa aquí en lugar de repartir `any` por el archivo.
interface ResultadoReconocimiento {
  readonly isFinal: boolean;
  readonly length: number;
  [i: number]: { readonly transcript: string };
}
interface EventoReconocimiento {
  readonly resultIndex: number;
  readonly results: { readonly length: number; [i: number]: ResultadoReconocimiento };
}
interface Reconocedor {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: EventoReconocimiento) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
}
type ConstructorReconocedor = new () => Reconocedor;

function obtenerConstructor(): ConstructorReconocedor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: ConstructorReconocedor;
    webkitSpeechRecognition?: ConstructorReconocedor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const dictadoSoportado = (): boolean => obtenerConstructor() !== null;

export interface OpcionesDictado {
  language: 'en' | 'es';
  /** Se llama con el texto ya dictado y cerrado, listo para guardar. */
  onTexto: (textoFinal: string) => void;
  onError?: (mensaje: string) => void;
}

export function useDictation({ language, onTexto, onError }: OpcionesDictado) {
  const [escuchando, setEscuchando] = useState(false);
  const [parcial, setParcial] = useState('');

  const recRef = useRef<Reconocedor | null>(null);
  // Que el usuario quiera seguir escuchando es distinto de que el navegador
  // siga escuchando: entre medias está la reanudación automática.
  const queriendoRef = useRef(false);

  // Las llamadas de vuelta se guardan en refs para que el reconocedor, que se
  // crea una sola vez por sesión de dictado, no se quede con una versión vieja
  // del estado del formulario.
  const onTextoRef = useRef(onTexto);
  const onErrorRef = useRef(onError);
  useEffect(() => { onTextoRef.current = onTexto; }, [onTexto]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const detener = useCallback(() => {
    queriendoRef.current = false;
    setEscuchando(false);
    setParcial('');
    try { recRef.current?.stop(); } catch { /* ya estaba parado */ }
  }, []);

  const iniciar = useCallback(() => {
    const Constructor = obtenerConstructor();
    if (!Constructor) {
      onErrorRef.current?.(language === 'es'
        ? 'Tu navegador no permite dictar. Prueba con Chrome.'
        : 'Your browser does not support dictation. Try Chrome.');
      return;
    }

    const rec = new Constructor();
    rec.lang = language === 'es' ? 'es-ES' : 'en-US';
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let cerrado = '';
      let enCurso = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const texto = r[0]?.transcript ?? '';
        if (r.isFinal) cerrado += texto;
        else enCurso += texto;
      }
      setParcial(enCurso);
      if (cerrado.trim()) onTextoRef.current(cerrado.trim());
    };

    rec.onerror = (e) => {
      const codigo = e.error ?? '';
      // `no-speech` y `aborted` no son fallos que merezcan avisar: pasan
      // constantemente al hacer una pausa o al detener a mano.
      if (codigo === 'no-speech' || codigo === 'aborted') return;
      queriendoRef.current = false;
      setEscuchando(false);
      setParcial('');
      onErrorRef.current?.(
        codigo === 'not-allowed' || codigo === 'service-not-allowed'
          ? (language === 'es'
              ? 'No diste permiso al micrófono. Actívalo en el candado de la barra de direcciones.'
              : 'Microphone permission was denied. Enable it from the padlock in the address bar.')
          : (language === 'es' ? 'Se interrumpió el dictado.' : 'Dictation was interrupted.'),
      );
    };

    rec.onend = () => {
      // Silencio largo: el navegador cierra solo. Si el usuario no pulsó
      // detener, se reabre.
      if (queriendoRef.current) {
        try { rec.start(); return; } catch { /* cae abajo */ }
      }
      setEscuchando(false);
      setParcial('');
    };

    recRef.current = rec;
    queriendoRef.current = true;
    try {
      rec.start();
      setEscuchando(true);
    } catch {
      queriendoRef.current = false;
      onErrorRef.current?.(language === 'es'
        ? 'No se pudo abrir el micrófono.'
        : 'Could not open the microphone.');
    }
  }, [language]);

  const alternar = useCallback(() => {
    if (queriendoRef.current) detener();
    else iniciar();
  }, [detener, iniciar]);

  // Salir de la pantalla con el micrófono abierto dejaría el indicador de
  // grabación encendido en la pestaña.
  useEffect(() => () => {
    queriendoRef.current = false;
    try { recRef.current?.abort(); } catch { /* nada que abortar */ }
  }, []);

  // El campo de texto que hay debajo del botón de dictar se queda enfocable
  // mientras se escucha. En el celular, si queda enfocado (o se vuelve a
  // tocar), el teclado nativo se abre encima — y el teclado de Android trae
  // SU PROPIO botón de dictado. Se enciende un segundo micrófono aparte del
  // de esta API, y las dos transcripciones se van intercalando en el mismo
  // campo: de ahí las palabras duplicadas.
  //
  // Arreglo centralizado aquí, no en cada formulario: mientras se está
  // escuchando, cualquier elemento que reciba el foco lo pierde al instante.
  // Eso mantiene cerrado el teclado nativo —y su micrófono— en todos los
  // cuadros de dictado de la aplicación a la vez, sin tocar treinta
  // componentes uno por uno.
  useEffect(() => {
    if (!escuchando) return;
    const quitarFoco = (e: FocusEvent) => {
      const el = e.target;
      if (el instanceof HTMLElement && typeof el.blur === 'function') el.blur();
    };
    document.addEventListener('focusin', quitarFoco);
    return () => document.removeEventListener('focusin', quitarFoco);
  }, [escuchando]);

  return { escuchando, parcial, iniciar, detener, alternar, soportado: dictadoSoportado() };
}

/** Une lo ya escrito con lo recién dictado, sin pegar palabras ni duplicar
 *  espacios. Si la frase anterior quedó cerrada con punto, la nueva empieza
 *  en mayúscula: el reconocedor no puntúa, y sin esto el texto sale como un
 *  bloque continuo en minúsculas. */
export function unirDictado(previo: string, nuevo: string): string {
  const base = previo.trimEnd();
  const trozo = nuevo.trim();
  if (!trozo) return previo;
  if (!base) return trozo.charAt(0).toUpperCase() + trozo.slice(1);
  const necesitaMayuscula = /[.!?]$/.test(base);
  const pieza = necesitaMayuscula ? trozo.charAt(0).toUpperCase() + trozo.slice(1) : trozo;
  return `${base} ${pieza}`;
}
