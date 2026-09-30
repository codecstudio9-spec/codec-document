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

// iPadOS se presenta como "MacIntel" en el user agent; lo delata la pantalla táctil.
const esIOS = (): boolean =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

/** Instrucciones para reactivar el micrófono, según dónde esté el usuario.
 *  En iPhone no hay candado en la barra: el ajuste vive en el menú «aA» de
 *  Safari, o en los Ajustes de iOS si se usa Chrome/Edge/Firefox. */
function mensajePermisoDenegado(language: 'en' | 'es'): string {
  const es = language === 'es';
  if (esIOS()) {
    const safari = !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
    if (safari) {
      return es
        ? 'Permiso de micrófono bloqueado. Toca «aA» en la barra de direcciones → Configuración del sitio web → Micrófono → Permitir, y vuelve a tocar el micrófono.'
        : 'Microphone permission is blocked. Tap "aA" in the address bar → Website Settings → Microphone → Allow, then tap the mic again.';
    }
    return es
      ? 'Permiso de micrófono bloqueado. Abre Ajustes del iPhone → tu navegador → activa Micrófono, y vuelve a tocar el micrófono.'
      : 'Microphone permission is blocked. Open iPhone Settings → your browser → turn on Microphone, then tap the mic again.';
  }
  // En Mac el bloqueo puede venir de macOS, no del sitio: si el navegador no
  // tiene permiso en Privacidad, el sitio nunca verá el micrófono aunque se
  // le dé permiso en el candado.
  if (typeof navigator !== 'undefined' && /Macintosh/.test(navigator.userAgent)) {
    return es
      ? 'No hay acceso al micrófono. Permítelo en el ícono de la barra de direcciones y revisa que tu navegador esté activado en Ajustes del Sistema → Privacidad y seguridad → Micrófono.'
      : 'No microphone access. Allow it from the address-bar icon and check that your browser is enabled in System Settings → Privacy & Security → Microphone.';
  }
  return es
    ? 'No diste permiso al micrófono. Actívalo en el candado de la barra de direcciones.'
    : 'Microphone permission was denied. Enable it from the padlock in the address bar.';
}

/**
 * Pide el micrófono de forma explícita antes de arrancar el reconocedor.
 *
 * Sin esto, en iOS el aviso de permiso depende de cómo WebKit enlace el
 * reconocimiento con el audio, y a veces el primer intento falla sin mostrar
 * nada. Con `getUserMedia` el navegador enseña su aviso estándar
 * («¿Permitir micrófono?») y basta con tocar Permitir. El flujo se suelta en
 * cuanto se concede: el reconocedor abre su propia captura y dos capturas a la
 * vez en iOS dan error `audio-capture`.
 *
 * Si el permiso ya consta como concedido se salta el paso, para no abrir y
 * cerrar el micrófono en cada toque.
 */
async function asegurarPermisoMicrofono(): Promise<'ok' | 'denegado' | 'sin-api'> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return 'sin-api';
  try {
    const estado = await navigator.permissions?.query({ name: 'microphone' as PermissionName });
    if (estado?.state === 'granted') return 'ok';
  } catch { /* Permissions API sin soporte para 'microphone': se pregunta igual */ }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return 'ok';
  } catch (e) {
    const nombre = (e as { name?: string })?.name;
    if (nombre === 'NotAllowedError' || nombre === 'SecurityError' || nombre === 'NotReadableError') return 'denegado';
    // Sin micrófono u otro fallo de hardware: que lo intente el reconocedor,
    // que dará su propio error si de verdad no hay audio.
    return 'ok';
  }
}

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

  // Evita que un doble toque mientras aparece el aviso de permiso abra dos
  // reconocedores.
  const arrancandoRef = useRef(false);

  const iniciar = useCallback(async () => {
    const Constructor = obtenerConstructor();
    if (!Constructor) {
      onErrorRef.current?.(language === 'es'
        ? 'Tu navegador no permite dictar. Prueba con Chrome.'
        : 'Your browser does not support dictation. Try Chrome.');
      return;
    }
    if (arrancandoRef.current) return;
    arrancandoRef.current = true;
    // asegurarPermisoMicrofono nunca lanza: todos sus fallos devuelven un estado.
    const permiso = await asegurarPermisoMicrofono();
    arrancandoRef.current = false;
    if (permiso === 'denegado') {
      onErrorRef.current?.(mensajePermisoDenegado(language));
      return;
    }

    const rec = new Constructor();
    rec.lang = language === 'es' ? 'es-ES' : 'en-US';
    rec.continuous = true;
    rec.interimResults = true;

    // Lo que ya se acumuló como "final" en ESTA sesión del reconocedor (se
    // reinicia cada vez que se llama a rec.start(), abajo y en onend). No
    // basta con usar `e.resultIndex` para saber qué es nuevo: en Chrome de
    // Android, `continuous: true` es poco fiable y a veces reenvía la frase
    // COMPLETA dicha hasta el momento como si fuera un resultado nuevo, en
    // vez de sólo la palabra que se añadió. Confiar en resultIndex ahí
    // duplica todo lo dicho ("Necesito Necesito Necesito una..."). Por eso
    // se compara siempre contra el acumulado propio, no contra el índice
    // que manda el navegador.
    let sesionFinal = '';

    rec.onresult = (e) => {
      let cerradoSesion = '';
      let enCurso = '';
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        const texto = r[0]?.transcript ?? '';
        if (r.isFinal) cerradoSesion += texto;
        else enCurso += texto;
      }
      setParcial(enCurso);

      if (cerradoSesion === sesionFinal) return;
      // Caso normal: lo nuevo extiende lo que ya había → se manda sólo la
      // diferencia. Caso Android: el navegador "olvidó" lo anterior y volvió
      // a empezar → se manda todo lo nuevo, no se reenvía lo ya mandado.
      const nuevo = cerradoSesion.startsWith(sesionFinal)
        ? cerradoSesion.slice(sesionFinal.length)
        : cerradoSesion;
      sesionFinal = cerradoSesion;
      if (nuevo.trim()) onTextoRef.current(nuevo.trim());
    };

    rec.onerror = (e) => {
      const codigo = e.error ?? '';
      // `no-speech` y `aborted` no son fallos que merezcan avisar: pasan
      // constantemente al hacer una pausa o al detener a mano.
      if (codigo === 'no-speech' || codigo === 'aborted') return;
      queriendoRef.current = false;
      setEscuchando(false);
      setParcial('');
      const es = language === 'es';
      let mensaje: string;
      if (codigo === 'service-not-allowed' && esIOS()) {
        // En iOS el reconocimiento usa el motor de Dictado del sistema: si
        // está apagado, falla aunque el micrófono tenga permiso.
        mensaje = es
          ? 'Activa el Dictado del iPhone: Ajustes → General → Teclado → Activar Dictado. Luego vuelve a tocar el micrófono.'
          : 'Turn on iPhone Dictation: Settings → General → Keyboard → Enable Dictation. Then tap the mic again.';
      } else if (codigo === 'service-not-allowed'
        && /Macintosh/.test(navigator.userAgent) && !/Chrome|Chromium|Edg|Firefox/.test(navigator.userAgent)) {
        // Safari de Mac usa el Dictado de macOS igual que el iPhone: con el
        // Dictado apagado falla aunque el sitio tenga permiso de micrófono.
        mensaje = es
          ? 'Activa el Dictado de tu Mac: Ajustes del Sistema → Teclado → Dictado. Luego vuelve a pulsar el micrófono.'
          : 'Turn on Mac Dictation: System Settings → Keyboard → Dictation. Then click the mic again.';
      } else if (codigo === 'not-allowed' || codigo === 'service-not-allowed') {
        mensaje = mensajePermisoDenegado(language);
      } else if (codigo === 'audio-capture') {
        mensaje = es
          ? 'Otra app está usando el micrófono. Ciérrala y vuelve a intentarlo.'
          : 'Another app is using the microphone. Close it and try again.';
      } else {
        mensaje = es ? 'Se interrumpió el dictado.' : 'Dictation was interrupted.';
      }
      onErrorRef.current?.(mensaje);
    };

    rec.onend = () => {
      // Silencio largo: el navegador cierra solo. Si el usuario no pulsó
      // detener, se reabre — y esa reapertura es una sesión nueva del
      // reconocedor, así que el acumulado de arriba se reinicia con ella.
      if (queriendoRef.current) {
        try {
          sesionFinal = '';
          rec.start();
          return;
        } catch { /* cae abajo */ }
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
