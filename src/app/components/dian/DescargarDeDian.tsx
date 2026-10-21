/**
 * Descargar XML de la DIAN a partir de una lista de CUFEs.
 *
 * ── Por qué esto ya NO se hace pegando el enlace aquí mismo ─────────────
 * Se verificó en vivo (2026-08-14) que la DIAN ata el token de acceso a la
 * IP que lo solicitó: el mismo enlace autentica sin problema abierto en el
 * Chrome del contador, y SIEMPRE falla si sale de un servidor compartido
 * —cabeceras de navegador perfectas incluidas—, porque la IP nunca es la
 * suya. El proxy (`dian-descargar`) quedó bloqueado de raíz, no por un bug
 * arreglable. La única forma de que la petición "sea" el contador es que
 * salga literalmente de su navegador: de ahí la extensión de Chrome
 * (`extension-dian/`), que hace exactamente lo que hacía el proxy pero
 * corriendo dentro de su propia sesión.
 *
 * Este panel ya no pide el enlace ni los CUFEs — eso ahora vive en el
 * popup de la extensión, porque ahí es donde puede llegar a la DIAN. Lo
 * que sí hace: saber si la extensión está instalada (preguntándole
 * directamente, ver use-dian-extension.ts) y, según eso, guiar al
 * contador a instalarla o a usarla.
 */

import { useEffect, useState } from 'react';
import {
  Download, X, CheckCircle2, Volume2, ExternalLink, RefreshCw,
  ClipboardCopy, PlugZap, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDianExtension } from '../../hooks/use-dian-extension';
import { DescargaPorRango } from './DescargaPorRango';

/** La extensión publicada en la Chrome Web Store. Antes se repartía un .zip
 *  que había que cargar en modo desarrollador; ya no hace falta. */
export const URL_EXTENSION_WEB_STORE = 'https://chromewebstore.google.com/detail/hgikiepfbdgaajbmkagdjebfeodiepcp';

interface Props {
  narrar?: (es: string, en: string) => void;
  onCerrar: () => void;
  /** CUFEs que ya se sabe que faltan, traídos de la verificación de arriba.
   *  Aquí ya no se pegan en un campo — la extensión no puede leer el
   *  portapapeles de esta página por sí sola —, pero sí se pueden copiar
   *  con un clic para pegarlos en el popup de la extensión. */
  cufesIniciales?: string[];
  /** Importa a Codec los .zip/.xml que bajó la extensión. */
  onImportar?: (archivos: File[]) => void;
}

const GUION_ES = 'Esta herramienta se mudó a una extensión de Chrome. La razón es de fondo: la DIAN empezó a atar el token de acceso a la computadora desde la que se pide, así que un servidor compartido como el nuestro ya no puede autenticarlo, sin importar qué tan bien se disfrace. Una extensión sí puede, porque corre dentro de tu propio navegador, con tu propia conexión. Si todavía no la instalas, dale al botón Agregar a Chrome aquí abajo: te lleva a la tienda de Chrome y se instala con un clic. Si ya la instalaste, dale clic al ícono de Codec Document en tu barra de Chrome, junto a la barra de direcciones, y ahí pegas el enlace del token y tus CUFEs, igual que hacías aquí antes. Cuando termine de bajar los documentos, quedan en tu carpeta de Descargas, dentro de una carpeta que se llama DIAN. Desde ahí los arrastras al recuadro de XML en Inicio, como cualquier XML que ya tuvieras guardado.';

const GUION_EN = 'This tool moved to a Chrome extension. The DIAN portal started tying the access token to the computer that requested it, so a shared server like ours can no longer authenticate it. A browser extension can, because it runs inside your own browser, on your own connection. If you have not installed it yet, use the Add to Chrome button below: it opens the Chrome Web Store and installs in one click. Once installed, click the Codec Document icon in your Chrome toolbar to paste the token link and your CUFEs there. When it finishes, the files land in your Downloads folder, inside a DIAN subfolder, drag them into the XML box on Home from there.';

export function DescargarDeDian({ narrar, onCerrar, cufesIniciales, onImportar }: Props) {
  const { estado, version, verificar, soportaRango, enviar } = useDianExtension();
  const [comprobando, setComprobando] = useState(false);

  useEffect(() => {
    narrar?.(GUION_ES, GUION_EN);
    // Solo al abrir el panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const comprobarDeNuevo = () => {
    setComprobando(true);
    verificar();
    setTimeout(() => setComprobando(false), 1300);
  };

  const copiarCufes = async () => {
    if (!cufesIniciales?.length) return;
    try {
      await navigator.clipboard.writeText(cufesIniciales.join('\n'));
      toast.success(`${cufesIniciales.length} CUFEs copiados. Pégalos en el popup de la extensión`);
    } catch {
      toast.error('No se pudo copiar. Selecciona la lista de abajo a mano.');
    }
  };

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-slate-100 bg-white px-5 py-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-600">
          <Download className="size-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-900">Descargar XML de la DIAN</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Ahora corre en tu navegador, no en un servidor compartido
          </p>
        </div>
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
        {estado === 'instalada' && soportaRango && (
          <DescargaPorRango enviar={enviar} onImportar={(a) => onImportar?.(a)} />
        )}

        <>
        <p className="mb-5 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>
            La DIAN empezó a atar el token al computador que lo pide. Un servidor compartido
            (como el que usaba esta pantalla antes) ya no puede autenticarlo. Por eso la
            descarga se mudó a una extensión que corre en tu propio Chrome.
          </span>
        </p>

        {cufesIniciales && cufesIniciales.length > 0 && (
          <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
            <p className="text-xs font-semibold text-slate-700">
              {cufesIniciales.length} documento(s) te faltan
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Cópialos y pégalos en la lista de CUFEs del popup de la extensión.
            </p>
            <button
              type="button"
              onClick={() => void copiarCufes()}
              className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
            >
              <ClipboardCopy className="size-3.5" />
              Copiar lista de CUFEs
            </button>
          </div>
        )}

        {estado === 'revisando' && !comprobando && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-6 text-xs text-slate-500">
            <RefreshCw className="size-3.5 animate-spin" />
            Comprobando si la extensión está instalada…
          </div>
        )}

        {estado === 'instalada' && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
              <CheckCircle2 className="size-4" />
              Extensión instalada{version ? ` (v${version})` : ''}
            </p>
            <ol className="mt-3 space-y-2.5">
              {[
                'Entra a la DIAN y solicita un token y te llega el enlace al correo.',
                <>Haz clic en el ícono de <strong>Codec Document</strong> en tu barra de Chrome, junto a la barra de direcciones.</>,
                'Pega el enlace ahí, dale a Probar, pega tus CUFEs y dale a Iniciar descarga.',
                <>Cuando termine, los archivos quedan en <code className="rounded bg-white px-1 py-0.5 text-[11px]">Descargas/DIAN/</code>. Arrástralos al recuadro de XML en Inicio.</>,
              ].map((t, i) => (
                <li key={i} className="flex gap-2.5 text-xs leading-relaxed text-emerald-900">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
        )}

        {estado === 'no-instalada' && (
          <div className="rounded-xl border border-slate-200 px-4 py-4">
            <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <PlugZap className="size-4 text-sky-600" />
              Instala la extensión de Codec Document
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Se instala una vez desde la tienda de Chrome y sirve para todas tus descargas.
            </p>

            <a
              href={URL_EXTENSION_WEB_STORE}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3.5 flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-700"
            >
              <Download className="size-4" />
              Agregar a Chrome (gratis)
            </a>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Se abre la tienda de Chrome. Pulsa «Agregar a Chrome», confirma, vuelve a esta pestaña y
              dale a «Ya la instalé, comprobar».
            </p>

            <button
              type="button"
              onClick={comprobarDeNuevo}
              disabled={comprobando}
              className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${comprobando ? 'animate-spin' : ''}`} />
              Ya la instalé, comprobar
            </button>
          </div>
        )}

        <a
          href="https://catalogo-vpfe.dian.gov.co"
          target="_blank"
          rel="noreferrer"
          className="mt-5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-600"
        >
          <ExternalLink className="size-3" />
          Abrir el portal de la DIAN para pedir un token
        </a>
        </>
      </div>
    </div>
  );
}
