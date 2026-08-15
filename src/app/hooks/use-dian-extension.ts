import { useCallback, useEffect, useState } from 'react';

/**
 * ID de la extensión "Codec Document — Descargador DIAN" (extension-dian/).
 *
 * OJO al retomar esto: este ID se calculó a mano con una clave RSA
 * (extension-dian/manifest.json ya NO la trae — la Chrome Web Store
 * rechaza el campo "key" en el manifiesto al subirlo, así que se quitó) y
 * sólo era válido para instalaciones "cargadas descomprimida" en modo
 * desarrollador. Una vez que la extensión quede publicada en la Chrome Web
 * Store, Google le asigna su PROPIO id permanente al crear el elemento
 * —visible en el panel de developer aunque esté en borrador, antes de
 * pasar la revisión— y ESE es el que hay que poner aquí. Hasta que eso
 * pase, la detección de "¿está instalada?" no va a funcionar para nadie.
 */
const EXTENSION_ID = 'nikdagbmkbmbmnmgcalhmhnhmgkconon'; // TODO: reemplazar por el ID real de la Chrome Web Store

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
