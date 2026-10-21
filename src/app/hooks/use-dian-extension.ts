import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * IDs posibles de la extensión "Codec Document — Descargador DIAN"
 * (extension-dian/):
 *   - el fijo que le da la clave pública del manifest (v3.0+): es el mismo
 *     en Mac y en Windows cuando se instala con "Cargar descomprimida";
 *   - el que asignó la Chrome Web Store al elemento en borrador, para cuando
 *     se publique allí.
 * Se prueban en orden y se usa el primero que responde.
 */
// Primero el de la Web Store (el que tienen los contadores). Estuvo mal
// escrito (le faltaba una «i») y por eso la extensión publicada nunca se
// detectaba. El segundo es el de la copia de desarrollo cargada a mano.
const EXTENSION_IDS = ['hgikiepfbdgaajbmkagdjebfeodiepcp', 'cljhonndmjmhffapnmleppolcabndaob'];

export type EstadoExtensionDian = 'revisando' | 'instalada' | 'no-instalada';

type Runtime = {
  sendMessage?: (id: string, msg: unknown, cb: (r: unknown) => void) => void;
  lastError?: unknown;
};

const runtime = (): Runtime | undefined =>
  (window as unknown as { chrome?: { runtime?: Runtime } }).chrome?.runtime;

function enviarA(id: string, msg: unknown, ms = 1500): Promise<unknown> {
  return new Promise((resolve) => {
    const rt = runtime();
    if (!rt?.sendMessage) { resolve(undefined); return; }
    let hecho = false;
    const t = setTimeout(() => { if (!hecho) { hecho = true; resolve(undefined); } }, ms);
    try {
      rt.sendMessage(id, msg, (r) => {
        void rt.lastError;
        if (hecho) return;
        hecho = true;
        clearTimeout(t);
        resolve(r);
      });
    } catch {
      clearTimeout(t);
      resolve(undefined);
    }
  });
}

/**
 * Detecta la extensión y permite hablarle.
 *
 * Funciona porque la extensión declara `externally_connectable` sólo para
 * codecdocument.com. Desde la v3.0 acepta, además del ping, las órdenes del
 * modo por rango (iniciarRango, estado, detener, reanudarValidacion,
 * abrirCarpeta). La descarga sigue ocurriendo en el Chrome del contador,
 * con su propia sesión de la DIAN.
 */
export function useDianExtension() {
  const [estado, setEstado] = useState<EstadoExtensionDian>('revisando');
  const [version, setVersion] = useState<string | null>(null);
  const [soportaRango, setSoportaRango] = useState(false);
  const idRef = useRef<string | null>(null);

  const verificar = useCallback(async () => {
    setEstado('revisando');
    if (!runtime()?.sendMessage) { setEstado('no-instalada'); return; }
    for (const id of EXTENSION_IDS) {
      const r = (await enviarA(id, { tipo: 'ping' }, 1200)) as { ok?: boolean; version?: string; rango?: boolean } | undefined;
      if (r?.ok) {
        idRef.current = id;
        setVersion(r.version ?? null);
        setSoportaRango(Boolean(r.rango));
        setEstado('instalada');
        return;
      }
    }
    setEstado('no-instalada');
  }, []);

  useEffect(() => { void verificar(); }, [verificar]);

  const enviar = useCallback(async <T = unknown>(msg: Record<string, unknown>, ms = 8000): Promise<T | undefined> => {
    if (!idRef.current) return undefined;
    return (await enviarA(idRef.current, msg, ms)) as T | undefined;
  }, []);

  return { estado, version, soportaRango, verificar, enviar };
}
