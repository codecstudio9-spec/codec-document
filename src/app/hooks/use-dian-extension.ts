import { useCallback, useEffect, useState } from 'react';

/**
 * ID de la extensión "Codec Document — Descargador DIAN" (extension-dian/),
 * el que le asignó la Chrome Web Store al crear el elemento (visible en el
 * panel de developer, arriba del todo, aunque el elemento esté en borrador
 * y no haya pasado la revisión todavía). Ya no depende de ninguna clave
 * local — ver el historial de este archivo si hace falta el porqué.
 */
const EXTENSION_ID = 'hgikepfbdgaajbmkagdjebfeodiepcp';

export type EstadoExtensionDian = 'revisando' | 'instalada' | 'no-instalada';

/**
 * Pregunta si la extensión está instalada, sin que el contador tenga que
 * saber explicarlo.
 *
 * Funciona porque la extensión declara `externally_connectable` con el
 * origen de codecdocument.com: eso la habilita a aceptar UN mensaje nuestro
 * ("¿estás ahí?") y nada más — no le da a esta página ningún permiso sobre
 * la extensión ni sobre la sesión de la DIAN.
 */
export function useDianExtension() {
  const [estado, setEstado] = useState<EstadoExtensionDian>('revisando');
  const [version, setVersion] = useState<string | null>(null);

  const verificar = useCallback(() => {
    setEstado('revisando');

    const runtime = (window as unknown as {
      chrome?: { runtime?: { sendMessage?: (...args: unknown[]) => void; lastError?: unknown } };
    }).chrome?.runtime;

    if (!runtime?.sendMessage) {
      // No es Chrome/Edge con soporte de extensiones, o el navegador no
      // expone chrome.runtime a la página. Sin esto no hay forma de
      // preguntar — se trata igual que "no instalada".
      setEstado('no-instalada');
      return;
    }

    let resuelto = false;
    const seVencio = setTimeout(() => {
      if (resuelto) return;
      resuelto = true;
      setEstado('no-instalada');
    }, 1200);

    try {
      runtime.sendMessage(EXTENSION_ID, { tipo: 'ping' }, (respuesta: { ok?: boolean; version?: string } | undefined) => {
        // Se consulta lastError para que Chrome no queje en consola por una
        // respuesta que nadie recogió — pasa siempre que la extensión no
        // está instalada, y es la forma normal de detectarlo, no un error.
        void runtime.lastError;
        if (resuelto) return;
        resuelto = true;
        clearTimeout(seVencio);
        if (respuesta?.ok) {
          setVersion(respuesta.version ?? null);
          setEstado('instalada');
        } else {
          setEstado('no-instalada');
        }
      });
    } catch {
      clearTimeout(seVencio);
      setEstado('no-instalada');
    }
  }, []);

  useEffect(() => { verificar(); }, [verificar]);

  return { estado, version, verificar };
}
