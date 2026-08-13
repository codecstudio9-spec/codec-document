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
export async function probarEnlaceDian(urlDian: string): Promise<void> {
  const res = await llamar({ url: urlDian, soloSesion: true });
  const j = await res.json().catch(() => ({}));
  if (res.ok && j.ok) return;

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
    throw new Error(
      j.motivo === 'pausado'
        ? `La herramienta está en pausa ${seg} segundo${seg === 1 ? '' : 's'} porque la DIAN venía rechazando peticiones. Tu enlace está bien: espera y vuelve a darle a Probar.`
        : `Vamos demasiado rápido para el ritmo que la DIAN tolera. Espera ${seg} segundo${seg === 1 ? '' : 's'} y vuelve a intentarlo.`,
    );
  }

  throw new Error(j.error ?? `La DIAN no respondió como se esperaba (código ${res.status}).`);
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface OpcionesDescarga {
  urlDian: string;
  endpoint?: string;
  cufes: string[];
  carpeta: FileSystemDirectoryHandle;
  cancelado: () => boolean;
  onEvento: (e: EventoDescarga) => void;
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
    try {
      await o.carpeta.getFileHandle(nombre);
      hechos++;
      avisar({ cufe, ok: true, detalle: 'ya estaba', hechos, total: o.cufes.length });
      continue;
    } catch {
      // No existe: hay que descargarlo.
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
          });
          listo = true;
        } else {
          await dormir(1500 * intentos);
        }
        continue;
      }

      try {
        const bytes = base64ABytes(j.contenido_b64 as string);
        const fh = await o.carpeta.getFileHandle(nombre, { create: true });
        const w = await fh.createWritable();
        await w.write(bytes);
        await w.close();

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
