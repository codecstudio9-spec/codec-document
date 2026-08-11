/**
 * Auditor: DIAN contra contabilidad.
 *
 * El contador sube el reporte de su programa contable y Codec le dice qué
 * está en la DIAN y no registró, qué registró sin respaldo, y qué cuadró
 * pero por otra cifra.
 *
 * ── El cruce es determinista ────────────────────────────────────────────
 * Toda la aritmética ocurre en lib/dian/auditoria.ts: emparejamiento exacto
 * por CUFE, luego por NIT+número, luego por valor con tolerancia. Aquí solo
 * se pinta. Un modelo de lenguaje no interviene en el cálculo — se equivoca
 * en números, y un contador que presenta a la DIAN con una cifra inventada
 * tiene un problema serio.
 */

import { useEffect, useRef, useState } from 'react';
import { Scale, Upload, Loader2, X, AlertTriangle, CheckCircle2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { analizarPlantilla, leerFilasDatos, XlsxRellenoError, type HojaDetectada } from '../../../lib/dian/xlsx-relleno';
import { normalizar } from '../../../lib/dian/mapeo-plantilla';
import {
  auditar, aNumero, CAMPOS_CONTABLES,
  type DocumentoDian, type RegistroContable, type ResultadoAuditoria,
} from '../../../lib/dian/auditoria';
import { generarXlsx } from '../../../lib/dian/xlsx';

const pesos = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

interface Props {
  cargarDocumentos: () => Promise<DocumentoDian[]>;
  narrar?: (es: string, en: string) => void;
  onCerrar: () => void;
}

export function AuditorFiscal({ cargarDocumentos, narrar, onCerrar }: Props) {
  const [archivo, setArchivo] = useState<{ nombre: string; bytes: Uint8Array } | null>(null);
  const [hojas, setHojas] = useState<HojaDetectada[]>([]);
  const [hojaSel, setHojaSel] = useState(0);
  const [mapa, setMapa] = useState<Record<string, number>>({});
  const [resultado, setResultado] = useState<ResultadoAuditoria | null>(null);
  const [muestra, setMuestra] = useState<string[][]>([]);
  const [esReporteCodec, setEsReporteCodec] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    narrar?.(
      'Aquí comparo lo que la DIAN tiene contra lo que ya registraste en tu contabilidad. Sube el reporte de tu programa contable del mismo periodo, me señalas cuáles columnas son el número, el NIT y el valor, y te digo qué documentos te faltan por registrar y cuáles registraste con otra cifra.',
      'Here I compare what DIAN has against what you already recorded in your books. Upload your accounting report for the same period, point out which columns hold the number, the tax ID and the amount, and I will tell you which documents you still need to record and which ones you recorded with a different figure.',
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Adivina qué columna del archivo contable corresponde a cada campo. */
  const auto = (encabezados: string[]): Record<string, number> => {
    const m: Record<string, number> = {};
    const usadas = new Set<number>();
    for (const campo of CAMPOS_CONTABLES) {
      const i = encabezados.findIndex((h, idx) => {
        if (!h || usadas.has(idx)) return false;
        const n = normalizar(h);
        return campo.alias.some((a) => n === a) || campo.alias.some((a) => a.length >= 4 && n.includes(a));
      });
      if (i !== -1) { m[campo.id] = i; usadas.add(i); }
    }
    return m;
  };

  /** Carga la vista previa de una hoja: sin ver lo que se leyó, el contador
   *  no tiene forma de saber si señaló bien las columnas. */
  const verHoja = (bytes: Uint8Array, todas: HojaDetectada[], i: number) => {
    setHojaSel(i);
    setMapa(auto(todas[i].encabezados));
    try {
      setMuestra(leerFilasDatos(bytes, todas[i].ruta, todas[i].filaEncabezados, 3));
    } catch { setMuestra([]); }
  };

  const elegir = async (f: File | undefined) => {
    if (!f) return;
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      const detectadas = analizarPlantilla(bytes);

      // El reporte que genera Codec trae estas hojas. Compararlo consigo
      // mismo no dice nada, y es un error facil de cometer porque acaba de
      // descargarlo.
      const nombres = detectadas.map((h) => h.nombre);
      const propio = nombres.includes('Reporte General') && nombres.includes('Reporte Detallado');
      setEsReporteCodec(propio);

      // Se elige la hoja que mas parece una lista de documentos: la de mas
      // columnas. Quedarse con la primera cae en la hoja de resumen, que
      // solo tiene Concepto y Valor y no sirve para cruzar nada.
      let mejor = 0;
      detectadas.forEach((h, i) => {
        if (h.encabezados.filter(Boolean).length > detectadas[mejor].encabezados.filter(Boolean).length) mejor = i;
      });

      setArchivo({ nombre: f.name, bytes });
      setHojas(detectadas);
      setResultado(null);
      verHoja(bytes, detectadas, mejor);
    } catch (e) {
      toast.error((e as XlsxRellenoError).message, { duration: 7000 });
    }
  };

  const cruzar = async () => {
    if (!archivo) return;
    const faltan = CAMPOS_CONTABLES.filter((c) => c.requerido && mapa[c.id] === undefined);
    if (faltan.length > 0) {
      toast.error(`Señala primero: ${faltan.map((f) => f.etiqueta).join(', ')}`);
      return;
    }

    setTrabajando(true);
    try {
      const hoja = hojas[hojaSel];
      const filas = leerFilasDatos(archivo.bytes, hoja.ruta, hoja.filaEncabezados);
      const contables: RegistroContable[] = filas
        .map((fila, i) => ({
          fila: hoja.filaEncabezados + 1 + i,
          cufe: mapa.cufe !== undefined ? (fila[mapa.cufe] ?? '') : '',
          nit: fila[mapa.nit] ?? '',
          numero: fila[mapa.numero] ?? '',
          valor: aNumero(fila[mapa.valor]),
          fecha: mapa.fecha !== undefined ? (fila[mapa.fecha] ?? '') : '',
        }))
        // Una fila sin NIT ni número es un total, un subtítulo o una fila en
        // blanco: los reportes contables vienen llenos de eso.
        .filter((c) => c.nit.trim() || c.numero.trim());

      if (contables.length === 0) {
        toast.error('No encontré registros en esa hoja. ¿Señalaste las columnas correctas?');
        return;
      }

      const documentos = await cargarDocumentos();
      const r = auditar(documentos, contables);
      setResultado(r);

      const pendientes = r.faltanEnContabilidad.length + r.conDiferencia.length;
      narrar?.(
        pendientes === 0
          ? `Todo cuadra. Comparé ${documentos.length} documentos de la DIAN contra ${contables.length} registros tuyos y no encontré diferencias.`
          : `Encontré ${pendientes} cosas para revisar. ${r.faltanEnContabilidad.length} documentos están en la DIAN y no en tu contabilidad, por ${pesos(r.resumen.valorFaltante)}. Y ${r.conDiferencia.length} están registrados pero por otro valor.`,
        pendientes === 0
          ? `Everything matches. I compared ${documentos.length} DIAN documents against ${contables.length} of your records and found no differences.`
          : `I found ${pendientes} things to review. ${r.faltanEnContabilidad.length} documents are in DIAN but not in your books.`,
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setTrabajando(false);
    }
  };

  const descargarInforme = () => {
    if (!resultado) return;
    const r = resultado;
    const bytes = generarXlsx([
      {
        nombre: 'Resumen',
        encabezados: ['Concepto', 'Cantidad', 'Valor'],
        filas: [
          ['Documentos en la DIAN', r.resumen.totalDian, r.resumen.valorDian],
          ['Registros en tu contabilidad', r.resumen.totalContable, r.resumen.valorContable],
          ['', '', ''],
          ['Conciliados', r.conciliados.length, ''],
          ['Registrados con otro valor', r.conDiferencia.length, ''],
          ['Faltan por registrar', r.faltanEnContabilidad.length, r.resumen.valorFaltante],
          ['Sin respaldo en la DIAN', r.sobranEnContabilidad.length, r.resumen.valorSobrante],
        ],
        anchos: [34, 14, 18],
      },
      {
        nombre: 'Faltan por registrar',
        encabezados: ['Tipo', 'Número', 'Fecha', 'NIT', 'Proveedor', 'Total', 'CUFE'],
        filas: r.faltanEnContabilidad.map((d) => [
          d.doc_type, d.full_number, d.issue_date, d.issuer_nit, d.issuer_name, Number(d.total), d.cufe,
        ]),
        anchos: [18, 16, 13, 14, 34, 16, 40],
      },
      {
        nombre: 'Con otro valor',
        encabezados: ['Número', 'NIT', 'Proveedor', 'Valor DIAN', 'Valor registrado', 'Diferencia', 'Fila'],
        filas: r.conDiferencia.map((e) => [
          e.dian.full_number, e.dian.issuer_nit, e.dian.issuer_name,
          Number(e.dian.total), e.contable.valor, e.diferencia, e.contable.fila,
        ]),
        anchos: [16, 14, 34, 16, 18, 16, 8],
      },
      {
        nombre: 'Sin respaldo DIAN',
        encabezados: ['Número', 'NIT', 'Valor', 'Fecha', 'Fila en tu archivo'],
        filas: r.sobranEnContabilidad.map((c) => [c.numero, c.nit, c.valor, c.fecha, c.fila]),
        anchos: [18, 16, 16, 14, 18],
      },
    ]);
    const url = URL.createObjectURL(new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `Auditoria DIAN vs contabilidad ${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-slate-100 bg-white px-5 py-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-600">
          <Scale className="size-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-900">DIAN contra tu contabilidad</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Qué te falta por registrar, qué registraste sin respaldo y qué quedó por otra cifra
          </p>
        </div>
        <button type="button" onClick={onCerrar} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100">
          <X className="size-5" />
        </button>
      </div>

      <div className="px-5 py-5">
        {!archivo ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 px-5 py-7 text-center">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => { void elegir(e.target.files?.[0]); e.target.value = ''; }}
            />
            <Upload className="mx-auto mb-2 size-6 text-slate-300" />
            <p className="text-sm font-semibold text-slate-800">Sube el reporte de TU programa contable</p>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">
              Entra a Siigo, Alegra, World Office o el que uses, saca el listado de compras
              o de documentos del mismo periodo, y expórtalo a Excel. Eso es lo que va aquí.
            </p>
            <p className="mx-auto mt-2 max-w-md rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-800">
              <strong>No subas el Excel que te dio Codec.</strong> Ese lo generé yo con los datos
              de la DIAN; compararlo consigo mismo no diría nada. Necesito el de tu contabilidad
              para poder cruzarlos.
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-3 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Seleccionar archivo
            </button>
          </div>
        ) : (
          <>
            {esReporteCodec && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                  <strong>Este es el reporte que generó Codec</strong>, no el de tu contabilidad.
                  Si lo comparo, todo va a cuadrar porque son los mismos datos. Sube el listado
                  que exportas desde Siigo, Alegra o el programa que uses.
                </span>
              </div>
            )}

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span className="text-sm font-semibold text-slate-800">{archivo.nombre}</span>
              <button
                type="button"
                onClick={() => { setArchivo(null); setHojas([]); setResultado(null); }}
                className="text-xs font-semibold text-slate-400 underline"
              >
                cambiar
              </button>
            </div>

            {hojas.length > 1 && (
              <label className="mb-4 block text-xs font-semibold text-slate-600">
                ¿En qué hoja está la lista de documentos?
                <select
                  value={hojaSel}
                  onChange={(e) => archivo && verHoja(archivo.bytes, hojas, Number(e.target.value))}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
                >
                  {hojas.map((h, i) => (
                    <option key={h.ruta} value={i}>
                      {h.nombre} — {h.encabezados.filter(Boolean).length} columnas, {h.filasConDatos} filas
                    </option>
                  ))}
                </select>
              </label>
            )}

            {/* Sin ver lo leído, el contador no puede saber si la hoja o la
                fila de encabezados son las correctas. Antes se le pedía
                señalar columnas a ciegas. */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                Esto es lo que leí
              </p>
              {hojas[hojaSel]?.encabezados.filter(Boolean).length < 3 ? (
                <div className="rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
                  Solo encontré {hojas[hojaSel]?.encabezados.filter(Boolean).length ?? 0} columna(s)
                  en esta hoja. Seguramente es un resumen y no la lista de documentos —
                  {hojas.length > 1 ? ' prueba con otra hoja arriba.' : ' revisa que el archivo traiga el listado detallado.'}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-[11px]" translate="no">
                    <thead>
                      <tr className="bg-slate-50">
                        {hojas[hojaSel].encabezados.map((h, i) => (
                          <th key={i} className="whitespace-nowrap border-b border-slate-200 px-2.5 py-2 text-left font-bold text-slate-600">
                            {h || <span className="text-slate-300">(vacía)</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {muestra.length === 0 ? (
                        <tr><td colSpan={99} className="px-2.5 py-3 text-slate-400">Sin filas de datos debajo del encabezado.</td></tr>
                      ) : muestra.map((fila, f) => (
                        <tr key={f} className="border-b border-slate-100 last:border-0">
                          {hojas[hojaSel].encabezados.map((_, i) => (
                            <td key={i} className="max-w-[160px] truncate px-2.5 py-1.5 text-slate-600">{fila[i] ?? ''}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-1.5 text-[11px] text-slate-400">
                Hoja «{hojas[hojaSel]?.nombre}», encabezados en la fila {hojas[hojaSel]?.filaEncabezados}.
                {hojas.length > 1 && ' Si no es la correcta, cámbiala arriba.'}
              </p>
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              ¿Dónde está cada dato?
            </p>
            <div className="space-y-2 rounded-xl bg-slate-50 p-3">
              {CAMPOS_CONTABLES.map((campo) => (
                <div key={campo.id} className="flex items-center gap-2">
                  <span className="w-2/5 shrink-0 text-xs font-medium text-slate-700">
                    {campo.etiqueta}
                    {campo.requerido && <span className="text-rose-500"> *</span>}
                  </span>
                  <select
                    value={mapa[campo.id] ?? ''}
                    onChange={(e) => setMapa((p) => {
                      const n = { ...p };
                      if (e.target.value === '') delete n[campo.id];
                      else n[campo.id] = Number(e.target.value);
                      return n;
                    })}
                    className={`min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-xs outline-none ${
                      mapa[campo.id] !== undefined
                        ? 'border-slate-200 bg-white text-slate-800'
                        : campo.requerido ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-400'
                    }`}
                  >
                    <option value="">— no la tengo —</option>
                    {hojas[hojaSel]?.encabezados.map((h, i) => h ? (
                      <option key={i} value={i}>{h}</option>
                    ) : null)}
                  </select>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void cruzar()}
              disabled={trabajando}
              className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {trabajando ? <Loader2 className="size-4 animate-spin" /> : <Scale className="size-4" />}
              Comparar
            </button>
          </>
        )}

        {resultado && (
          <div className="mt-6">
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: 'Conciliados', v: resultado.conciliados.length, c: 'text-emerald-600' },
                { l: 'Con otro valor', v: resultado.conDiferencia.length, c: 'text-amber-600' },
                { l: 'Faltan por registrar', v: resultado.faltanEnContabilidad.length, c: 'text-rose-600' },
                { l: 'Sin respaldo DIAN', v: resultado.sobranEnContabilidad.length, c: 'text-slate-600' },
              ].map((x) => (
                <div key={x.l} className="rounded-xl bg-slate-50 px-3.5 py-3">
                  <div className={`text-2xl font-bold tabular-nums ${x.c}`}>{x.v}</div>
                  <div className="mt-0.5 text-[11px] leading-tight text-slate-500">{x.l}</div>
                </div>
              ))}
            </div>

            {resultado.resumen.valorFaltante > 0 && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-3 text-xs leading-relaxed text-rose-800 ring-1 ring-rose-200">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Tienes <strong>{pesos(resultado.resumen.valorFaltante)}</strong> en documentos que
                  la DIAN registra y tu contabilidad no. Si son compras, ahí hay IVA que no estás
                  descontando.
                </span>
              </p>
            )}

            {resultado.faltanEnContabilidad.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Faltan por registrar
                </p>
                <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl bg-slate-50 p-3">
                  {resultado.faltanEnContabilidad.slice(0, 60).map((d) => (
                    <div key={d.id} className="flex items-center justify-between gap-3 text-xs">
                      <span className="min-w-0 flex-1 truncate">
                        <strong className="text-slate-800">{d.full_number}</strong>
                        <span className="text-slate-500"> · {d.issuer_name}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-slate-700">{pesos(Number(d.total))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resultado.conDiferencia.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Registrados con otro valor
                </p>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3">
                  {resultado.conDiferencia.slice(0, 40).map((e) => (
                    <div key={e.dian.id} className="text-xs">
                      <strong className="text-slate-800">{e.dian.full_number}</strong>
                      <span className="text-slate-500"> · {e.dian.issuer_name}</span>
                      <div className="tabular-nums text-slate-600">
                        DIAN {pesos(Number(e.dian.total))} · tú {pesos(e.contable.valor)} ·
                        <span className="font-bold text-amber-700"> diferencia {pesos(Math.abs(e.diferencia))}</span>
                        <span className="text-slate-400"> (fila {e.contable.fila})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={descargarInforme}
              className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <Download className="size-4" />
              Descargar el informe completo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
