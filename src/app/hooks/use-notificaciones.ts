import { useCallback, useEffect, useState } from 'react';
import { sonarAvisoCodec } from '../lib/sonido-codec';

/**
 * Las notificaciones del módulo del contador.
 *
 * ── Por qué en el navegador y no en una tabla ───────────────────────────
 * Todo lo que se avisa aquí lo genera o lo detecta esta misma pantalla:
 * terminó una importación, cambió el plan, entró un pago, llegaron archivos
 * nuevos al buzón. No hay ningún emisor externo que necesite dejar un mensaje
 * para más tarde, así que una tabla con su RLS y su Realtime sería
 * infraestructura para un problema que no existe.
 *
 * La consecuencia hay que asumirla y decirla: son por navegador. Quien abra la
 * cuenta en otro equipo no verá las de aquí. Para lo que se avisa —«tu Excel
 * está listo», «el pago entró»— eso es correcto: son cosas del rato que estás
 * trabajando, no un historial que haya que conservar.
 *
 * Si algún día hay que avisar de algo que ocurre con la pestaña cerrada —un
 * correo que llega de madrugada, por ejemplo— entonces sí hará falta la tabla,
 * y este hook pasa a leer de ahí sin que cambie nada de lo que hay encima.
 */

export type TipoNotificacion = 'pago' | 'plan' | 'proceso' | 'revision' | 'correo';

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  detalle?: string;
  /** Milisegundos desde época. */
  fecha: number;
  leida: boolean;
}

/** Cuántas se guardan. Más allá de veinte nadie baja a mirar, y el localStorage
 *  de un contador que procesa todos los meses crecería sin tope. */
const TOPE = 20;

const CLAVE = 'codec_dian_notificaciones';

function leer(): Notificacion[] {
  try {
    const bruto = localStorage.getItem(CLAVE);
    if (!bruto) return [];
    const datos = JSON.parse(bruto) as Notificacion[];
    return Array.isArray(datos) ? datos.slice(0, TOPE) : [];
  } catch {
    return [];
  }
}

function guardar(lista: Notificacion[]): void {
  try { localStorage.setItem(CLAVE, JSON.stringify(lista.slice(0, TOPE))); } catch { /* da igual */ }
}

export function useNotificaciones() {
  const [lista, setLista] = useState<Notificacion[]>([]);

  // En un efecto y no en el `useState` inicial: leer localStorage durante el
  // primer render rompe la hidratación si algún día esto se renderiza en
  // servidor, y aquí no cuesta nada esperar un tick.
  useEffect(() => { setLista(leer()); }, []);

  const añadir = useCallback((
    n: Omit<Notificacion, 'id' | 'fecha' | 'leida'>,
    opciones?: { silenciosa?: boolean },
  ) => {
    setLista((previa) => {
      const nueva: Notificacion = {
        ...n,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fecha: Date.now(),
        leida: false,
      };
      const siguiente = [nueva, ...previa].slice(0, TOPE);
      guardar(siguiente);
      return siguiente;
    });

    // El sonido va fuera del setState a propósito: React puede invocar el
    // actualizador dos veces en modo estricto, y el aviso sonaría doble.
    if (!opciones?.silenciosa) sonarAvisoCodec();
  }, []);

  const marcarTodasLeidas = useCallback(() => {
    setLista((previa) => {
      if (previa.every((n) => n.leida)) return previa;
      const siguiente = previa.map((n) => ({ ...n, leida: true }));
      guardar(siguiente);
      return siguiente;
    });
  }, []);

  const limpiar = useCallback(() => {
    setLista([]);
    guardar([]);
  }, []);

  const sinLeer = lista.reduce((n, x) => (x.leida ? n : n + 1), 0);

  return { lista, sinLeer, añadir, marcarTodasLeidas, limpiar };
}
