/**
 * Descargar XML de la DIAN a partir de una lista de CUFEs.
 *
 * ── El flujo, con su parte manual ───────────────────────────────────────
 * Hay pasos que el contador tiene que hacer en el portal, y no se pueden
 * automatizar sin sus credenciales:
 *
 *   1. Pide el token en la DIAN → le llega el enlace al correo
 *   2. Pega ese enlace aquí
 *   3. Abre el enlace, exporta el listado del periodo y copia los CUFEs
 *   4. Los pega aquí y elige la carpeta
 *   5. Codec descarga los XML y los deja en esa carpeta
 *
 * Luego arrastra esa carpeta a la herramienta de Documentos DIAN, que ya
 * sabe leerla. No se toca ese flujo.
 *
 * ── Por qué va tan medido ───────────────────────────────────────────────
 * El navegador no puede pedirle archivos a la DIAN (CORS), así que la
 * petición sale de nuestro servidor y el tráfico de todos los contadores
 * comparte las mismas IPs. El gobernador del servidor mantiene el total en
 * ~2 peticiones por segundo pase lo que pase; aquí sólo se respeta lo que
 * él responde. Ir más rápido no acelera nada y arriesga el bloqueo de la
 * IP para todos los clientes a la vez.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Download, FolderOpen, Loader2, X, CheckCircle2, XCircle, AlertTriangle,
  Play, Square, Link2, Volume2,
} from 'lucide-react';
import { toast } from 'sonner';
import { descargarDeDian, probarEnlaceDian, type EventoDescarga } from '../../services/dian-descarga-service';
import { CARD_RADIUS } from '../../styles/mobile-theme';

/** Endpoint por defecto para bajar un documento por CUFE.
 *
 *  Va como valor editable y no cableado: es lo único del flujo que no
 *  pudimos confirmar contra el portal, y si la DIAN lo cambia el contador
 *  puede corregirlo sin esperar un despliegue. El botón «Probar» dice en un
 *  clic si funciona. */
const ENDPOINT_POR_DEFECTO = 'https://catalogo-vpfe.dian.gov.co/Document/DownloadZipFile?trackId={CUFE}';

interface Props {
  narrar?: (es: string, en: string) => void;
  onCerrar: () => void;
}

type Entrada = { cufe: string; estado: 'pendiente' | 'ok' | 'error'; detalle?: string };

/** El recorrido completo, en el orden en que hay que hacerlo.
 *
 *  Se guarda como texto y no en linea porque el boton de repetir tiene que
 *  poder decir exactamente lo mismo: alguien que se pierde a mitad
 *  necesita oir la version entera otra vez, no un resumen distinto.
 *
 *  Es largo a proposito. La parte manual de este proceso es justo la que
 *  confunde, y un contador que no sabe de donde sale el token abandona
 *  antes de llegar a la parte automatica. */
const GUION_ES = 'Esta herramienta baja los documentos de la DIAN por ti, pero hay una parte que tienes que hacer tu, porque necesita tus claves. Te la explico. Primero, entra al portal de la DIAN y solicita un token. La DIAN te manda un correo con el asunto Token Acceso DIAN. En ese correo hay un boton que dice Ingrese aqui. No le des clic todavia: haz clic derecho encima y elige Copiar direccion del enlace. Ese enlace lo pegas aqui en el primer campo, y le das al boton Probar para confirmar que sirve. Ojo con esto: el token vence a los sesenta minutos y solo funciona una vez. Segundo, abre ese mismo enlace en otra pestana, entra a Documentos, exporta el listado del periodo que necesites, y abre el Excel que te descarga. Ahi viene una columna que se llama CUFE. Copia esa columna completa y pegala aqui abajo. Tercero, elige la carpeta de tu computador donde quieres que te deje los archivos, y dale a Iniciar descarga. A partir de ahi yo hago el resto. Voy despacio a proposito, para que la DIAN no nos bloquee, asi que si son muchos documentos tomate un cafe. Cuando termine, arrastras esa carpeta a la pantalla de atras y yo leo todo y te armo la tabla y el Excel.';

const GUION_EN = 'This tool downloads your DIAN documents, but there is one part you have to do yourself because it needs your credentials. First, go to the DIAN portal and request a token. DIAN emails you a link. Right-click it and choose Copy link address, then paste it in the first field here and hit Test. The token expires in sixty minutes and works only once. Second, open that same link in another tab, export the listing for your period, open the spreadsheet and copy the CUFE column. Paste it below. Third, pick the folder on your computer where you want the files, and hit Start download. I go slowly on purpose so DIAN does not block us.';

export function DescargarDeDian({ narrar, onCerrar }: Props) {
  const [urlDian, setUrlDian] = useState('');
  const [endpoint, setEndpoint] = useState(ENDPOINT_POR_DEFECTO);
  const [mostrarAvanzado, setMostrarAvanzado] = useState(false);
  const [textoCufes, setTextoCufes] = useState('');
  const [carpeta, setCarpeta] = useState<FileSystemDirectoryHandle | null>(null);
  const [probando, setProbando] = useState(false);
  const [enlaceOk, setEnlaceOk] = useState<boolean | null>(null);
  const [corriendo, setCorriendo] = useState(false);
  const [progreso, setProgreso] = useState({ hechos: 0, total: 0, ok: 0, errores: 0 });
  const [registro, setRegistro] = useState<Entrada[]>([]);
  const cancelar = useRef(false);

  // El guion completo al abrir. Si el contador tiene la guia apagada,
  // narrar() no hace nada, asi que no hay que consultar su estado.
  useEffect(() => {
    narrar?.(GUION_ES, GUION_EN);
    // Solo al abrir el panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const soportaCarpetas = typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function';

  const elegirCarpeta = async () => {
    try {
      const dir = await (window as unknown as {
        showDirectoryPicker: (o?: { mode?: string }) => Promise<FileSystemDirectoryHandle>;
      }).showDirectoryPicker({ mode: 'readwrite' });
      setCarpeta(dir);
      narrar?.(
        `Voy a guardar todo en la carpeta ${dir.name}. Recuérdala, porque al terminar tienes que arrastrarla a la pantalla de atrás para que yo lea los documentos.`,
        `I will save everything to the folder ${dir.name}. Remember it: when I finish you need to drag it to the previous screen so I can read the documents.`,
      );
    } catch {
      // El usuario canceló el diálogo: no es un error que reportar.
    }
  };

  const probar = async () => {
    if (!urlDian.trim()) { toast.error('Pega primero el enlace que te llegó al correo'); return; }
    setProbando(true);
    setEnlaceOk(null);
    try {
      await probarEnlaceDian(urlDian.trim());
      setEnlaceOk(true);
      toast.success('El enlace funciona: la DIAN abrió sesión.');
      narrar?.(
        'Tu enlace funciona. Ahora pega la lista de CUFEs, elige la carpeta donde quieres los archivos y dale a Descargar.',
        'Your link works. Now paste the CUFE list, choose the folder where you want the files, and hit Download.',
      );
    } catch (e) {
      setEnlaceOk(false);
      const msg = (e as Error).message;
      toast.error(msg, { duration: 9000 });
      // El fallo casi siempre es el mismo y tiene una salida concreta.
      // Decírsela en voz alta evita que se quede mirando un error rojo sin
      // saber que solo tiene que pedir otro token.
      narrar?.(
        msg.includes('acceso') || msg.includes('token')
          ? 'Ese enlace ya no sirve. El token de la DIAN dura sesenta minutos y solo funciona una vez, así que si ya lo abriste o pasó de una hora, hay que pedir otro. Vuelve al portal, solicita un token nuevo, y copia el enlace del correo recién llegado.'
          : `No pude conectar con la DIAN. ${msg}`,
        msg.includes('acceso') || msg.includes('token')
          ? 'That link no longer works. The DIAN token lasts sixty minutes and works only once. Request a new one and copy the link from the fresh email.'
          : `I could not reach DIAN. ${msg}`,
      );
    } finally {
      setProbando(false);
    }
  };

  const cufesDeTexto = useCallback((): string[] => {
    const vistos = new Set<string>();
    for (const c of textoCufes.split(/[\s,;]+/)) {
      const t = c.trim().toLowerCase();
      if (/^[0-9a-f]{90,100}$/.test(t)) vistos.add(t);
    }
    return [...vistos];
  }, [textoCufes]);

  const iniciar = async () => {
    const cufes = cufesDeTexto();
    if (!urlDian.trim()) { toast.error('Falta el enlace de la DIAN'); return; }
    if (cufes.length === 0) { toast.error('No encontré CUFEs válidos en la lista'); return; }
    if (!carpeta) { toast.error('Elige primero la carpeta donde guardar'); return; }

    cancelar.current = false;
    setCorriendo(true);
    setRegistro([]);
    setProgreso({ hechos: 0, total: cufes.length, ok: 0, errores: 0 });

    narrar?.(
      `Empiezo a descargar ${cufes.length} documentos. Voy a ritmo moderado para que la DIAN no nos bloquee, así que puede tardar. No cierres esta pestaña; te aviso al terminar.`,
      `Starting to download ${cufes.length} documents. I go at a moderate pace so DIAN does not block us, so it may take a while. Do not close this tab.`,
    );

    // Los totales se llevan aquí y no leyéndolos del estado.
    //
    // Antes se hacía dentro de un setProgreso(p => …) para "aprovechar" el
    // valor actual, y eso tumbaba la página entera: el actualizador de
    // estado de React tiene que ser una función PURA, y ahí dentro se
    // estaba llamando al asistente de voz. React lo puede ejecutar dos
    // veces o en otro momento, y el efecto secundario revienta el render.
    let ok = 0;
    let errores = 0;

    try {
      await descargarDeDian({
        urlDian: urlDian.trim(),
        endpoint: endpoint.trim() || undefined,
        cufes,
        carpeta,
        cancelado: () => cancelar.current,
        onEvento: (e: EventoDescarga) => {
          if (e.ok) ok++; else errores++;
          const hechos = e.hechos;
          const total = e.total;
          const okActual = ok;
          const erroresActual = errores;
          setProgreso({ hechos, total, ok: okActual, errores: erroresActual });

          const entrada: Entrada = {
            cufe: e.cufe,
            estado: e.ok ? 'ok' : 'error',
            detalle: e.detalle,
          };
          setRegistro((r) => [entrada, ...r].slice(0, 60));
        },
      });

      narrar?.(
        errores === 0
          ? `Listo. Descargué ${ok} documentos en tu carpeta. Ahora arrastra esa carpeta a la pantalla de atrás y yo los leo.`
          : `Terminé. ${ok} documentos descargados y ${errores} con problema. Arrastra la carpeta a la pantalla de atrás para procesar los que sí bajaron.`,
        errores === 0
          ? `Done. I downloaded ${ok} documents to your folder. Now drag that folder to the previous screen.`
          : `Finished. ${ok} downloaded, ${errores} failed.`,
      );
      toast.success('Descarga terminada. Arrastra la carpeta a Documentos DIAN.');
    } catch (e) {
      // Nada de lo que pase aquí dentro puede tumbar la pantalla. Una
      // descarga que falla es un contratiempo; perder la página con los
      // CUFEs ya pegados y la carpeta ya elegida obliga a repetirlo todo.
      const msg = e instanceof Error ? e.message : 'Ocurrió un problema durante la descarga.';
      console.error('[dian-descarga]', e);
      toast.error(msg, { duration: 9000 });
      narrar?.(
        `Se interrumpió la descarga. ${ok > 0 ? `Alcancé a bajar ${ok} documentos, que ya están en tu carpeta.` : ''} Puedes volver a darle a Iniciar: no repito lo que ya se descargó.`,
        `The download stopped. ${ok > 0 ? `I managed to get ${ok} documents.` : ''} You can hit Start again: I skip what is already downloaded.`,
      );
    } finally {
      setCorriendo(false);
    }
  };

  const cufes = cufesDeTexto();
  const pct = progreso.total > 0 ? Math.round((progreso.hechos / progreso.total) * 100) : 0;
  const minutos = Math.ceil(cufes.length / 2 / 60);

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-slate-100 bg-white px-5 py-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-600">
          <Download className="size-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-900">Descargar XML de la DIAN</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Pega tus CUFEs y te dejo los archivos en la carpeta que elijas
          </p>
        </div>
        {/* Repetir las instrucciones. El guion es largo y la parte manual
            tiene varios pasos en otra pestaña: quien vuelve tras hacerlos
            necesita oírlo entero otra vez, no adivinar por dónde iba. */}
        <button
          type="button"
          onClick={() => narrar?.(GUION_ES, GUION_EN)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
          title="Escuchar las instrucciones"
        >
          <Volume2 className="size-4" />
          Explícame
        </button>
        <button type="button" onClick={onCerrar} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100">
          <X className="size-5" />
        </button>
      </div>

      <div className="px-5 py-5">
        {!soportaCarpetas && (
          <p className="mb-4 rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
            Tu navegador no permite guardar en una carpeta. Usa <strong>Chrome</strong> o
            <strong> Edge</strong> en computador para esta función.
          </p>
        )}

        {/* Guía del paso manual: sin ella el contador no sabe de dónde
            saca el enlace ni los CUFEs. */}
        <ol className="mb-5 space-y-2 rounded-xl bg-slate-50 px-4 py-3.5">
          {[
            'Entra a la DIAN y solicita tu token. Te llega un correo de «Token Acceso DIAN».',
            'En ese correo, clic derecho sobre «Ingrese aquí» → Copiar dirección del enlace. Pégalo abajo.',
            'Abre ese mismo enlace en otra pestaña, exporta el listado del periodo y copia la columna de CUFEs.',
            'Pega los CUFEs aquí, elige la carpeta y dale a Descargar.',
          ].map((t, i) => (
            <li key={i} className="flex gap-2.5 text-xs leading-relaxed text-slate-600">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-slate-900 text-[10px] font-bold text-white">
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>

        <label className="block text-xs font-semibold text-slate-600">
          Enlace de la DIAN (del correo del token)
          <div className="mt-1.5 flex gap-2">
            <input
              value={urlDian}
              onChange={(e) => { setUrlDian(e.target.value); setEnlaceOk(null); }}
              onPaste={() => {
                // Al pegar, no al teclear: nadie escribe una URL de la DIAN
                // a mano, y narrar en cada pulsacion seria insufrible.
                setTimeout(() => narrar?.(
                  'Ya pegaste el enlace. Dale al boton Probar que esta al lado, y te confirmo si todavia sirve antes de que empieces.',
                  'You pasted the link. Hit the Test button next to it and I will confirm whether it still works before you start.',
                ), 250);
              }}
              placeholder="https://catalogo-vpfe.dian.gov.co/…&rk=…&token=…"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs outline-none transition focus:border-sky-400 focus:bg-white"
            />
            <button
              type="button"
              onClick={() => void probar()}
              disabled={probando || corriendo}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {probando ? <Loader2 className="size-3.5 animate-spin" /> : <Link2 className="size-3.5" />}
              Probar
            </button>
          </div>
        </label>
        {enlaceOk === true && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <CheckCircle2 className="size-3.5" /> El enlace funciona
          </p>
        )}
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
          El token dura <strong>60 minutos</strong>. Si la descarga es larga, puede vencerse a
          mitad: pide otro, pégalo y continúa — no se repite lo ya descargado.
        </p>

        <label className="mt-4 block text-xs font-semibold text-slate-600">
          Carpeta donde guardar
          <div className="mt-1.5 flex gap-2">
            <div className="min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
              {carpeta ? carpeta.name : <span className="text-slate-400">Ninguna elegida</span>}
            </div>
            <button
              type="button"
              onClick={() => void elegirCarpeta()}
              disabled={!soportaCarpetas || corriendo}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <FolderOpen className="size-3.5" />
              Examinar
            </button>
          </div>
        </label>

        <label className="mt-4 block text-xs font-semibold text-slate-600">
          Lista de CUFEs (uno por línea)
          <textarea
            value={textoCufes}
            onChange={(e) => setTextoCufes(e.target.value)}
            onPaste={() => {
              // Tras el pegado, no durante: el estado todavía no se ha
              // actualizado cuando se dispara el evento.
              setTimeout(() => {
                const n = cufesDeTexto().length;
                narrar?.(
                  n > 0
                    ? 'Ya tengo tus CUFEs. Ahora elige la carpeta donde quieres los archivos y dale a Iniciar descarga.'
                    : 'Pegaste algo, pero no reconocí ningún CUFE. Un CUFE son noventa y seis caracteres, entre números y letras de la a a la efe. Revisa que hayas copiado la columna completa del Excel de la DIAN, sin el encabezado.',
                  n > 0
                    ? 'I have your CUFEs. Now pick the folder where you want the files and hit Start download.'
                    : 'I could not recognize any CUFE. A CUFE is ninety-six characters. Make sure you copied the whole column from the DIAN spreadsheet.',
                );
              }, 350);
            }}
            rows={6}
            placeholder="Pega aquí la columna CUFE/CUDE del Excel que descargaste de la DIAN"
            className="mt-1.5 block w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-mono text-[11px] outline-none transition focus:border-sky-400 focus:bg-white"
          />
        </label>
        {textoCufes.trim() && (
          <p className="mt-1.5 text-xs text-slate-500">
            <strong className="tabular-nums text-slate-800">{cufes.length}</strong> CUFEs válidos
            {cufes.length > 0 && ` · unos ${minutos} minuto(s) a ritmo seguro`}
          </p>
        )}

        <button
          type="button"
          onClick={() => setMostrarAvanzado((v) => !v)}
          className="mt-3 text-[11px] font-semibold text-slate-400 underline"
        >
          {mostrarAvanzado ? 'Ocultar' : 'Opciones avanzadas'}
        </button>
        {mostrarAvanzado && (
          <label className="mt-2 block text-xs font-semibold text-slate-600">
            Dirección de descarga por documento
            <input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-[11px] outline-none focus:border-sky-400 focus:bg-white"
            />
            <span className="mt-1 block font-normal text-[11px] text-slate-400">
              Usa <code className="rounded bg-slate-100 px-1">{'{CUFE}'}</code> donde va el código.
              Solo cámbialo si la DIAN modifica su portal.
            </span>
          </label>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => void iniciar()}
            disabled={corriendo || !soportaCarpetas}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-700 disabled:opacity-50"
          >
            {corriendo ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            {corriendo ? 'Descargando…' : 'Iniciar descarga'}
          </button>
          {corriendo && (
            <button
              type="button"
              onClick={() => { cancelar.current = true; }}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Square className="size-3.5" /> Detener
            </button>
          )}
        </div>

        {progreso.total > 0 && (
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                {progreso.hechos} de {progreso.total}
              </span>
              <span className="tabular-nums text-slate-500">
                {progreso.ok} ok{progreso.errores > 0 && ` · ${progreso.errores} con problema`}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${pct}%` }} />
            </div>

            {registro.length > 0 && (
              <div className="mt-3 max-h-52 space-y-1 overflow-y-auto rounded-xl bg-slate-50 p-3">
                {registro.map((r, i) => (
                  <div key={`${r.cufe}-${i}`} className="flex items-start gap-2 text-[11px]">
                    {r.estado === 'ok'
                      ? <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-emerald-500" />
                      : <XCircle className="mt-0.5 size-3 shrink-0 text-rose-500" />}
                    <span className="min-w-0 flex-1">
                      <span className="font-mono text-slate-500">{r.cufe.slice(0, 24)}…</span>
                      {r.detalle && <span className="block text-rose-600">{r.detalle}</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {progreso.total > 0 && !corriendo && progreso.ok > 0 && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 px-3.5 py-3 text-xs leading-relaxed text-emerald-900 ring-1 ring-emerald-200">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Listo. Cierra esto y <strong>arrastra la carpeta «{carpeta?.name}»</strong> a la zona
              de arriba: yo leo los XML y te armo la tabla y el Excel.
            </span>
          </p>
        )}

        <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-slate-400">
          <AlertTriangle className="mt-0.5 size-3 shrink-0" />
          <span>
            La descarga va a ritmo moderado a propósito. Todos los contadores compartimos la
            misma salida hacia la DIAN, y forzarla arriesga que nos bloqueen a todos.
          </span>
        </p>
      </div>
    </div>
  );
}
