import { Wand2, X } from 'lucide-react';
import type { DetectedField, FuenteCampo } from '../../../lib/docxTemplateEngine';
import { describirFuente } from '../../../lib/camposDerivados';

/**
 * «¿Quién llena este dato?» en el editor de plantillas: quien llena el
 * formulario (lo normal) o «se llena solo» a partir de otros datos. Pensado
 * para anexos y resúmenes que repiten lo que ya se escribió arriba (ciudad,
 * fecha, nombre y cédula del titular, saldo de la deuda).
 */
interface Props {
  campo: DetectedField;
  campos: DetectedField[];
  language: 'en' | 'es';
  onChange: (fuente: FuenteCampo | undefined) => void;
}

type Modo = 'formulario' | FuenteCampo['tipo'];

const selectClass = 'min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-indigo-400';

export function FuenteCampoEditor({ campo, campos, language, onChange }: Props) {
  const es = language !== 'en';
  const otros = campos.filter((f) => f.type !== 'section' && f.key !== campo.key && !f.fuente);
  const numericos = otros.filter((f) => f.type === 'number' || /valor|cuota|total|monto|precio|saldo|pago|abono/i.test(`${f.key} ${f.label}`));
  const fechas = otros.filter((f) => f.type === 'date' || /fecha/i.test(`${f.key} ${f.label}`));
  const fuente = campo.fuente;
  const modo: Modo = fuente?.tipo ?? 'formulario';

  const cambiarModo = (m: Modo) => {
    if (m === 'formulario') return onChange(undefined);
    // Sin dato preseleccionado: antes se ponía el primero de la lista (la
    // fecha) y un «Celular» quedaba copiando la fecha del contrato sin que
    // nadie lo eligiera.
    if (m === 'copiar') return onChange({ tipo: 'copiar', campos: [''] });
    if (m === 'restar') return onChange({ tipo: 'restar', campo: '', menos: [''] });
    return onChange({ tipo: 'fecha', campo: '', parte: 'completa' });
  };

  const opciones = (lista: DetectedField[], valor: string, alCambiar: (k: string) => void, vacio?: string) => (
    <select value={valor} onChange={(e) => alCambiar(e.target.value)} className={`${selectClass} ${!valor && vacio === undefined ? 'border-amber-400 bg-amber-50' : ''}`}>
      <option value="">{vacio ?? (es ? 'Elige un dato…' : 'Pick a detail…')}</option>
      {(lista.length ? lista : otros).map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
    </select>
  );

  return (
    <div className={`flex flex-col gap-2 rounded-xl border p-2.5 ${fuente ? 'border-violet-200 bg-violet-50/70' : 'border-transparent'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
          <Wand2 className="size-3.5 text-violet-500" /> {es ? '¿Quién llena este dato?' : 'Who fills in this detail?'}
        </span>
        <select value={modo} onChange={(e) => cambiarModo(e.target.value as Modo)} className={selectClass}>
          <option value="formulario">{es ? 'Quien llena el formulario' : 'Whoever fills in the form'}</option>
          <option value="copiar">{es ? 'Se llena solo: igual a otro dato' : 'Automatic: same as another detail'}</option>
          <option value="restar">{es ? 'Se llena solo: una resta (saldo)' : 'Automatic: a subtraction (balance)'}</option>
          <option value="fecha">{es ? 'Se llena solo: de una fecha' : 'Automatic: from a date'}</option>
        </select>
      </div>

      {fuente?.tipo === 'copiar' && (
        <div className="flex flex-wrap items-center gap-1.5">
          {fuente.campos.map((k, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-xs font-bold text-slate-400">+</span>}
              {opciones(otros, k, (nk) => onChange({ ...fuente, campos: fuente.campos.map((x, j) => (j === i ? nk : x)) }))}
              {fuente.campos.length > 1 && (
                <button type="button" onClick={() => onChange({ ...fuente, campos: fuente.campos.filter((_, j) => j !== i) })} className="text-slate-300 hover:text-red-500">
                  <X className="size-3.5" />
                </button>
              )}
            </span>
          ))}
          <button type="button" onClick={() => onChange({ ...fuente, campos: [...fuente.campos, otros[0]?.key ?? ''] })} className="text-[11px] font-bold text-violet-600 hover:text-violet-800">
            {es ? '+ unir otro dato' : '+ join another detail'}
          </button>
        </div>
      )}

      {fuente?.tipo === 'restar' && (
        <div className="flex flex-wrap items-center gap-1.5">
          {opciones(numericos, fuente.campo, (k) => onChange({ ...fuente, campo: k }))}
          {fuente.menos.map((k, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-400">−</span>
              {opciones(numericos, k, (nk) => onChange({ ...fuente, menos: fuente.menos.map((x, j) => (j === i ? nk : x)) }))}
              {fuente.menos.length > 1 && (
                <button type="button" onClick={() => onChange({ ...fuente, menos: fuente.menos.filter((_, j) => j !== i) })} className="text-slate-300 hover:text-red-500">
                  <X className="size-3.5" />
                </button>
              )}
            </span>
          ))}
          <button type="button" onClick={() => onChange({ ...fuente, menos: [...fuente.menos, numericos[0]?.key ?? ''] })} className="text-[11px] font-bold text-violet-600 hover:text-violet-800">
            {es ? '+ restar otro' : '+ subtract another'}
          </button>
        </div>
      )}

      {fuente?.tipo === 'fecha' && (
        <div className="flex flex-wrap items-center gap-1.5">
          <select value={fuente.parte} onChange={(e) => onChange({ ...fuente, parte: e.target.value as typeof fuente.parte })} className={selectClass}>
            <option value="completa">{es ? 'Fecha completa' : 'Full date'}</option>
            <option value="dia">{es ? 'Solo el día' : 'Day only'}</option>
            <option value="mes">{es ? 'Mes en letras' : 'Month name'}</option>
            <option value="mesNumero">{es ? 'Mes en número' : 'Month number'}</option>
            <option value="anio">{es ? 'Año (2026)' : 'Year (2026)'}</option>
            <option value="anio2">{es ? 'Año en 2 cifras (26)' : 'Year, 2 digits (26)'}</option>
          </select>
          <span className="text-xs text-slate-400">{es ? 'de' : 'of'}</span>
          {opciones(fechas, fuente.campo, (k) => onChange({ ...fuente, campo: k }))}
          <span className="text-xs text-slate-400">{es ? 'más los meses de' : 'plus the months in'}</span>
          {opciones(numericos, fuente.sumarMesesDe ?? '', (k) => onChange({ ...fuente, sumarMesesDe: k || undefined }), es ? '(ninguno)' : '(none)')}
        </div>
      )}

      {fuente && (
        <p className="text-[11px] text-violet-700">
          {es ? 'No se pregunta en el formulario. Sale de: ' : 'Not asked in the form. Comes from: '}
          <strong>{describirFuente(fuente, campos, language)}</strong>
        </p>
      )}
    </div>
  );
}
