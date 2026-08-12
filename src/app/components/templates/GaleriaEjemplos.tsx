/**
 * Galería de plantillas de ejemplo.
 *
 * El problema que resuelve es de lectura, no de estilo. Cada tarjeta se
 * titulaba «Contrato de Obra a Suma Alzada — Plantilla de Ejemplo
 * (Constructora)»: tres datos distintos apretados en una línea que ocupaba
 * tres renglones y empujaba el resto de la tarjeta, así que ninguna medía lo
 * mismo y la rejilla se veía desalineada.
 *
 * Y de esos tres datos, uno sobra: el encabezado de la sección ya dice
 * «Plantillas de ejemplo». Repetirlo en cada tarjeta es ruido que compite con
 * lo único que el usuario está buscando ahí — de qué es el contrato.
 *
 * Ahora el nombre va solo, el sector se convierte en una etiqueta con su
 * propio color, y la tarjeta tiene alturas fijas por zona para que todas
 * midan igual. Las tarjetas se agrupan por sector, que es como alguien busca:
 * no lee nueve títulos, busca «el de recursos humanos».
 */

import { useMemo, useState } from 'react';
import { Sparkles, Copy, Loader, ChevronDown } from 'lucide-react';
import type { PublicExampleTemplate } from '../../services/docx-template-service';

interface Props {
  ejemplos: PublicExampleTemplate[];
  language: 'en' | 'es';
  cloningId: string | null;
  onUsar: (ex: PublicExampleTemplate) => void;
}

/** Paleta por sector. Se elige por el nombre del sector y no al azar, para que
 *  el mismo sector conserve su color entre recargas y entre sesiones: un color
 *  que cambia cada vez no ayuda a reconocer nada. */
const PALETA = ['#7C3AED', '#2563EB', '#0891B2', '#059669', '#D97706', '#DC2626', '#DB2777', '#4F46E5'];

function colorDeSector(sector: string): string {
  let suma = 0;
  for (let i = 0; i < sector.length; i++) suma = (suma + sector.charCodeAt(i)) % 9973;
  return PALETA[suma % PALETA.length];
}

/**
 * Parte «Contrato de Obra a Suma Alzada — Plantilla de Ejemplo (Constructora)»
 * en su nombre y su sector.
 *
 * Se aceptan las dos rayas —la larga y el guion— porque las etiquetas se
 * escribieron a mano y no siempre usan la misma. Si el formato no encaja, se
 * devuelve la etiqueta entera como nombre: es preferible un título largo a uno
 * recortado por la mitad.
 */
export function partirEtiqueta(etiqueta: string): { nombre: string; sector: string } {
  let texto = etiqueta.trim();
  let sector = '';

  const conSector = /^(.*?)\s*\(([^()]+)\)\s*$/.exec(texto);
  if (conSector) {
    texto = conSector[1].trim();
    sector = conSector[2].trim();
  }

  texto = texto
    .replace(/\s*[—–-]\s*Plantilla de Ejemplo\s*$/i, '')
    .replace(/\s*[—–-]\s*Example Template\s*$/i, '')
    .trim();

  return { nombre: texto || etiqueta, sector };
}

export function GaleriaEjemplos({ ejemplos, language, cloningId, onUsar }: Props) {
  const es = language === 'es';
  const [sectorActivo, setSectorActivo] = useState<string | null>(null);

  const tarjetas = useMemo(
    () => ejemplos.map((ex) => {
      const { nombre, sector } = partirEtiqueta(ex.exampleLabel || ex.name);
      return { ex, nombre, sector: sector || (es ? 'General' : 'General') };
    }),
    [ejemplos, es],
  );

  const sectores = useMemo(() => {
    const cuenta = new Map<string, number>();
    for (const t of tarjetas) cuenta.set(t.sector, (cuenta.get(t.sector) ?? 0) + 1);
    return [...cuenta.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));
  }, [tarjetas]);

  const visibles = sectorActivo ? tarjetas.filter((t) => t.sector === sectorActivo) : tarjetas;

  return (
    <div className="mt-6">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-400">
        <Sparkles className="size-4 text-purple-500" />
        {es ? 'Plantillas de ejemplo' : 'Example templates'}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
          {ejemplos.length}
        </span>
      </h2>

      {/* Filtro por sector. Con nueve ejemplos de nueve rubros distintos, nadie
          lee nueve títulos: busca «el de recursos humanos». */}
      {sectores.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSectorActivo(null)}
            className="rounded-full px-3 py-1.5 text-[11px] font-bold transition"
            style={sectorActivo === null
              ? { background: '#0F172A', color: '#fff' }
              : { background: '#fff', color: '#475569', border: '1px solid #E2E8F0' }}
          >
            {es ? 'Todos' : 'All'}
          </button>
          {sectores.map(([sector, cuantas]) => {
            const color = colorDeSector(sector);
            const activo = sectorActivo === sector;
            return (
              <button
                key={sector}
                type="button"
                onClick={() => setSectorActivo(activo ? null : sector)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition"
                style={activo
                  ? { background: color, color: '#fff' }
                  : { background: '#fff', color: '#475569', border: '1px solid #E2E8F0' }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: activo ? '#fff' : color }}
                />
                {sector}
                <span className="tabular-nums opacity-60">{cuantas}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map(({ ex, nombre, sector }) => {
          const color = colorDeSector(sector);
          const instrucciones = (es ? ex.instructionsEs : ex.instructionsEn) || (es
            ? 'Obtén tu propia copia independiente — reescribe las cláusulas, campos y formulario como lo necesites.'
            : 'Get your own independent copy — rewrite the clauses, fields, and form however you need.');
          return (
            <div
              key={ex.id}
              className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              {/* Franja de color del sector: identifica el rubro de un vistazo,
                  antes de leer nada. */}
              <span className="mb-3.5 block h-1 w-9 rounded-full" style={{ background: color }} />

              <span
                className="mb-2 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide"
                style={{ background: `${color}14`, color }}
              >
                {sector}
              </span>

              {/* Altura fija en el título y en la descripción. Con textos de
                  largos distintos, sin esto cada tarjeta mide diferente y la
                  rejilla se ve torcida aunque cada tarjeta esté bien. */}
              <p className="line-clamp-2 min-h-[2.6em] text-sm font-bold leading-snug text-slate-900">
                {nombre}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-slate-400">
                {ex.fieldCount} {es ? 'campos · totalmente editable' : 'fields · fully editable'}
              </p>

              <p className="mt-2.5 line-clamp-3 min-h-[3.9em] text-xs leading-relaxed text-slate-500">
                {instrucciones}
              </p>

              <button
                type="button"
                disabled={cloningId === ex.id}
                onClick={() => onUsar(ex)}
                className="mt-4 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-white transition hover:brightness-110 disabled:opacity-60"
                style={{ background: color }}
              >
                {cloningId === ex.id ? <Loader className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
                {es ? 'Usar esta plantilla' : 'Use this template'}
              </button>
            </div>
          );
        })}
      </div>

      {sectorActivo && visibles.length < tarjetas.length && (
        <button
          type="button"
          onClick={() => setSectorActivo(null)}
          className="mx-auto mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-slate-700"
        >
          <ChevronDown className="size-3.5" />
          {es
            ? `Ver las ${tarjetas.length} plantillas de ejemplo`
            : `See all ${tarjetas.length} example templates`}
        </button>
      )}
    </div>
  );
}
