/**
 * Descarga de documentos desde la DIAN, a través del proxy del servidor.
 *
 * El navegador no puede pedirle archivos a catalogo-vpfe.dian.gov.co
 * (CORS), así que cada petición pasa por la Edge Function `dian-descargar`.
 * Ella abre la sesión con el enlace del token, la cachea, y pide turno al
 * gobernador global antes de salir a la red.
 *
 * Aquí NO se decide el ritmo: se obedece. Cuando el servidor responde 429
 * dice cuántos milisegundos esperar y se espera exactamente eso. Intentar
 * ir más rápido no acelera nada —el cubo de fichas es global— y arriesga
 * que la DIAN bloquee la IP para todos los clientes a la vez.
 */

import { supabase } from '../../lib/supabase';
import { base64ABytes } from '../../lib/dian/xlsx-relleno';

const FUNCION = `${import.meta.env.VITE_SUPABASE_URL ?? 'https://yxzchnldmfsgdtbjurey.supabase.co'}/functions/v1/dian-descargar`;

export interface EventoDescarga {
  cufe: string;
  ok: boolean;
  detalle?: string;
  /** Fragmento de lo que respondió la DIAN cuando falla, para distinguir un
   *  token vencido de un bloqueo del WAF sin adivinar por el mensaje. */
  muestra?: string;
  hechos: number;
  total: number;
}

async function llamar(cuerpo: Record<string, unknown>): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Necesitas iniciar sesión.');
  return fetch(FUNCION, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cuerpo),
  });
}

/** Comprueba que el enlace del correo sigue abriendo sesión.
 *
 *  Vale la pena antes de lanzar cientos de descargas: si el token venció o
 *  el enlace ya se usó, se descubre en un segundo y no a mitad del lote. */
/** Lo que la DIAN respondió, tal cual. Sirve para saber de quién es el fallo
 *  en vez de deducirlo de un mensaje redactado por nosotros. */
export interface DetalleDian {
  status: number;
  urlFinal: string;
  acaboEnLogin: boolean;
  cookiesRecibidas: number;
  tieneCookieSesion: boolean;
  cookieSesionViva: boolean;
  azureRef: string | null;
  muestra?: string;
}

/** Error de la prueba del enlace que además lleva la evidencia cruda. */
export class ErrorEnlaceDian extends Error {
  constructor(mensaje: string, public readonly detalle?: DetalleDian) {
    super(mensaje);
    this.name = 'ErrorEnlaceDian';
  }
}

export async function probarEnlaceDian(urlDian: string): Promise<DetalleDian | undefined> {
  // Comprobación de forma antes de gastar una petición contra la DIAN.
  // El enlace del correo lleva tres parámetros; si al copiar entró sólo un
  // trozo, la DIAN devuelve un 500 que parece un fallo suyo y no lo es.
  try {
    const u = new URL(urlDian.trim());
    if (/\/User\/AuthToken/i.test(u.pathname) && !u.searchParams.get('token')) {
      throw new ErrorEnlaceDian(
        'Ese enlace está incompleto: le falta la parte «&token=…». Vuelve al correo, clic derecho sobre «Ingrese aquí» → Copiar dirección del enlace, y pega lo que copies sin recortar.',
      );
    }
  } catch (e) {
    if (e instanceof ErrorEnlaceDian) throw e;
    throw new ErrorEnlaceDian('Eso no parece una dirección web. Copia el enlace desde el correo de la DIAN.');
  }

  const res = await llamar({ url: urlDian, soloSesion: true });
  const j = await res.json().catch(() => ({}));
  if (res.ok && j.ok) return j.dian as DetalleDian | undefined;

  // El servidor tiene DOS formas de decir que no, y sólo una trae `error`.
  //
  // Cuando el gobernador de ritmo frena la petición responde 429 con
  // `{ espera, esperar_ms, motivo }` y NINGÚN campo `error`. Antes eso caía
  // al texto de reserva —«No se pudo abrir sesión con la DIAN»— y le echaba
  // la culpa al enlace, que estaba perfecto. El contador pedía otro token,
  // volvía a intentarlo, seguía en pausa, y no había forma de salir del bucle
  // ni de entender por qué.
  if (res.status === 429 || j.espera) {
    const seg = Math.max(1, Math.ceil(Number(j.esperar_ms ?? 0) / 1000));
    throw new ErrorEnlaceDian(
      j.motivo === 'pausado'
        ? `La herramienta está en pausa ${seg} segundo${seg === 1 ? '' : 's'} porque la DIAN venía rechazando peticiones. Tu enlace está bien: espera y vuelve a darle a Probar.`
        : `Vamos demasiado rápido para el ritmo que la DIAN tolera. Espera ${seg} segundo${seg === 1 ? '' : 's'} y vuelve a intentarlo.`,
    );
  }

  throw new ErrorEnlaceDian(
    j.error ?? `La DIAN no respondió como se esperaba (código ${res.status}).`,
    j.dian as DetalleDian | undefined,
  );
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface OpcionesDescarga {
  urlDian: string;
  endpoint?: string;
  cufes: string[];
  /** Dónde dejar los archivos. Opcional: sin carpeta, lo descargado sólo se
   *  entrega por `onArchivo` y no toca el disco. */
  carpeta?: FileSystemDirectoryHandle;
  cancelado: () => boolean;
  onEvento: (e: EventoDescarga) => void;
  /**
   * Cada archivo recién descargado, con sus bytes.
   *
   * Existe para poder analizar lo descargado sin obligar al contador a
   * buscar la carpeta y arrastrar los archivos de vuelta. Los bytes ya
   * estaban aquí en memoria un instante antes de escribirse al disco; ese
   * rodeo no aportaba nada salvo trabajo manual.
   */
  onArchivo?: (nombre: string, bytes: Uint8Array) => void;
}

/**
 * Descarga los documentos y los escribe en la carpeta del disco.
 *
 * Secuencial a propósito: el gobernador es global, así que lanzar diez en
 * paralelo sólo produce diez esperas simultáneas. El ritmo lo marca el
 * servidor.
 */
export async function descargarDeDian(o: OpcionesDescarga): Promise<void> {
  let hechos = 0;

  // El aviso de progreso es cosmetico: si algo falla al pintarlo, no puede
  // llevarse por delante una descarga de 2000 documentos.
  const avisar = (e: EventoDescarga) => {
    try { o.onEvento(e); } catch (err) { console.error('[dian-descarga] onEvento', err); }
  };

  for (const cufe of o.cufes) {
    if (o.cancelado()) return;

    // Si el archivo ya está en la carpeta, no se vuelve a pedir. Es lo que
    // permite reanudar cuando el token vence a mitad de un lote largo: se
    // pide otro token y se relanza sobre la misma carpeta.
    const nombre = `${cufe}.zip`;
    if (o.carpeta) {
      try {
        const fh = await o.carpeta.getFileHandle(nombre);
        hechos++;
        // Ya estaba en disco, pero el analizador igual lo necesita: se lee y
        // se entrega. Sin esto, reanudar un lote dejaba fuera del análisis
        // justo lo que ya se había bajado.
        if (o.onArchivo) {
          try {
            const f = await fh.getFile();
            o.onArchivo(nombre, new Uint8Array(await f.arrayBuffer()));
          } catch { /* si no se puede leer, se descarga de nuevo abajo */ }
        }
        avisar({ cufe, ok: true, detalle: 'ya estaba', hechos, total: o.cufes.length });
        continue;
      } catch {
        // No existe: hay que descargarlo.
      }
    }

    let intentos = 0;
    let listo = false;

    while (!listo && intentos < 4) {
      if (o.cancelado()) return;
      intentos++;

      let res: Response;
      try {
        res = await llamar({ url: o.urlDian, urlDescarga: o.endpoint, cufe });
      } catch {
        await dormir(2000);
        continue;
      }

      const j = await res.json().catch(() => ({}));

      // 429 no es un fallo: es el gobernador diciendo cuándo volver.
      if (res.status === 429 && j.esperar_ms) {
        await dormir(Math.min(Number(j.esperar_ms) + 100, 60_000));
        intentos--; // esperar no consume un intento
        continue;
      }

      if (!res.ok || !j.ok) {
        if (intentos >= 3) {
          hechos++;
          avisar({
            cufe, ok: false, hechos, total: o.cufes.length,
            detalle: j.error ?? `error ${res.status}`,
            muestra: j.muestra,
          });
          listo = true;
        } else {
          await dormir(1500 * intentos);
        }
        continue;
      }

      try {
        const bytes = base64ABytes(j.contenido_b64 as string);

        // Al disco sólo si hay carpeta. El XML es el documento con validez
        // legal, así que guardarlo sigue siendo lo normal; pero exigir una
        // carpeta para poder analizar era un requisito artificial.
        if (o.carpeta) {
          const fh = await o.carpeta.getFileHandle(nombre, { create: true });
          const w = await fh.createWritable();
          await w.write(bytes);
          await w.close();
        }
        o.onArchivo?.(nombre, bytes);

        hechos++;
        avisar({ cufe, ok: true, hechos, total: o.cufes.length });
        listo = true;
      } catch (e) {
        hechos++;
        avisar({
          cufe, ok: false, hechos, total: o.cufes.length,
          detalle: `no se pudo guardar: ${(e as Error).message}`,
        });
        listo = true;
      }
    }
  }
}
