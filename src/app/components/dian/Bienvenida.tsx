import { Menu, HelpCircle } from 'lucide-react';
import { BANNER_BG } from '../../styles/contador-theme';
import { CifrasMes } from './ResumenMes';
import type { ResumenMes as ResumenMesDatos } from '../../services/dian-service';

/**
 * Franja de bienvenida del panel para contadores.
 *
 * ── Por qué vuelve a ser azul ───────────────────────────────────────────
 * Una versión anterior la puso en blanco porque la franja azul competía con
 * la barra lateral, que también es azul. El problema no era el color sino que
 * la franja iba de lado a lado de la ventana, incluida la parte que queda
 * encima del menú: dos bloques azules pegados sin nada que los separe. Ahora
 * la barra lateral es fija y la franja empieza donde ella termina, así que se
 * leen como un marco continuo y no como dos piezas peleándose.
 *
 * ── Por qué las cifras van AQUÍ ─────────────────────────────────────────
 * Estaban más abajo, bajo el título «Resumen del mes», y había que bajar para
 * verlas. Son la respuesta a la pregunta con la que el contador abre esto —
 * «¿cómo va el mes?»—, y la respuesta no se pone debajo del pliegue.
 *
 * Antes ocupaban este sitio cuatro pasos numerados que explicaban el
 * recorrido. Se quitaron al fijar la barra lateral: el menú ya enseña de un
 * vistazo todo lo que la herramienta hace, que era justo el trabajo que
 * hacían los pasos.
 */

export function Bienvenida({
  nombre, rol, onAbrirMenu, onAyuda, resumen,
}: {
  nombre?: string;
  rol?: string;
  onAbrirMenu: () => void;
  onAyuda?: () => void;
  /** Sin datos —cuenta recién abierta— la tarjeta de cifras no se dibuja:
   *  cuatro ceros dan la bienvenida peor que no decir nada. */
  resumen?: ResumenMesDatos | null;
}) {
  const iniciales = (nombre ?? 'C').slice(0, 2).toUpperCase();
  const hayCifras = !!resumen && resumen.documentos > 0;

  return (
    <div className="relative overflow-hidden" style={{ background: BANNER_BG }}>
      {/* Dos manchas de luz muy difusas. Es lo que separa un degradado plano
          de una superficie con profundidad, y a la vez levanta el lado donde
          va la tarjeta blanca para que no parezca pegada sobre un vacío. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 100% at 88% -10%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 55%),'
            + 'radial-gradient(90% 80% at 0% 110%, rgba(2,20,80,0.30) 0%, rgba(2,20,80,0) 60%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-6 pt-4 sm:px-6">
        {/* Fila superior: sólo el menú en móvil, ayuda y cuenta a la derecha. */}
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onAbrirMenu}
            className="shrink-0 rounded-xl bg-white/15 p-2 text-white ring-1 ring-white/25 transition hover:bg-white/25 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </button>

          <div className="flex-1" />

          {onAyuda && (
            <button
              type="button"
              onClick={onAyuda}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-[12.5px] font-bold text-white ring-1 ring-white/25 transition hover:bg-white/25"
            >
              <HelpCircle className="size-4" />
              <span className="hidden sm:inline">¿Necesitas ayuda?</span>
            </button>
          )}

          <div className="flex shrink-0 items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-full bg-white text-[12px] font-black text-blue-700 ring-1 ring-white/40">
              {iniciales}
            </div>
            <div className="hidden leading-tight lg:block">
              <p className="text-[12.5px] font-bold text-white">{nombre ?? 'Mi cuenta'}</p>
              <p className="text-[11px] text-white/65">{rol ?? 'Contador'}</p>
            </div>
          </div>
        </div>

        {/* Saludo y cifras. En escritorio conviven en una fila; por debajo de
            xl la tarjeta baja entera, porque cuatro cifras apretadas contra el
            saludo no se leen ni bien ni rápido. */}
        <div className="grid items-center gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,660px)]">
          <div className="min-w-0">
            <p className="truncate text-[26px] font-black leading-tight text-white sm:text-[30px]">
              {nombre ? `Hola, ${nombre}` : 'Hola'} <span aria-hidden>👋</span>
            </p>
            <p className="mt-1 max-w-md text-[13px] leading-relaxed text-white/80">
              Automatiza tu trabajo con la DIAN y ahorra horas cada mes.
              Enfócate en lo que importa, nosotros hacemos el resto.
            </p>
          </div>

          {hayCifras && <CifrasMes datos={resumen} />}
        </div>
      </div>
    </div>
  );
}
