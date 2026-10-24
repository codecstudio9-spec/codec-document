import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Store, Zap, ReceiptText, ExternalLink, MessageCircle, Loader2, Copy, Link2, Unplug, CheckCircle2,
  Download, BookOpenCheck, ChevronDown, Wallet, Undo2, Calculator, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Boton, Vacio } from '../dian/PiezasPanel';
import { BOTON_PRIMARIO, BOTON_NEUTRO, BOTON_EXITO } from '../../styles/contador-theme';
import {
  vinculoPos, conexionPosAnterior, generarCodigoPos, desconectarPos, ventasPos, contabilizarDiaPos,
  gastosPos, devolucionesPos, cierresPos, contabilizarGastosDiaPos, resumenPos, posRecibiendo, haceCuanto,
  type Empresa, type VinculoPos, type VentaPos, type GastoPos, type DevolucionPos, type CierrePos, type ResumenPos,
} from '../../services/contabilidad-service';
import { generarXlsx, type ValorCelda } from '../../../lib/dian/xlsx';
import { triggerDownload } from '../../utils/download';

/**
 * Codec POS dentro de cada empresa.
 *
 * Sin conexión: el contador genera un código y se lo pasa a su cliente, que
 * lo pega en su Codec POS (Configuración > Mi contador). Así el dueño del
 * negocio es quien autoriza compartir sus ventas. Si el cliente no usa Codec
 * POS, aquí mismo se le recomienda por WhatsApp.
 *
 * Conectada: ventas, gastos, devoluciones y cierres de caja del mes. Las
 * ventas del día (netas de devoluciones) se vuelven comprobante de ventas
 * (VP) y los gastos del día comprobante de egreso (CE). Lo que tiene factura
 * o nota crédito electrónica no entra: su XML llega aparte y se causa como
 * cualquier documento.
 */

const pesos = (v: number) => v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const diaBogota = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

export function CarpetaCodecPos({ empresa, periodo, puedeEditar = true }: { empresa: Empresa; periodo?: string; puedeEditar?: boolean }) {
  const [vinculo, setVinculo] = useState<VinculoPos | null | undefined>(undefined);
  const [anterior, setAnterior] = useState<VinculoPos | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const [resumen, setResumen] = useState<ResumenPos | null>(null);

  const cargar = useCallback(async (silencioso = false) => {
    try {
      const [actual, previo] = await Promise.all([vinculoPos(empresa.id), conexionPosAnterior(empresa.id)]);
      setVinculo((antes) => {
        // El cliente acaba de pegar el código: se celebra una sola vez.
        if (antes?.estado === 'pendiente' && actual?.estado === 'activo') {
          toast.success(`¡${empresa.nombre_comercial || empresa.razon_social} quedó conectada con Codec POS!`, {
            description: 'Ya está recibiendo sus ventas, gastos, cierres de caja y documentos.',
          });
        }
        return actual;
      });
      setAnterior(previo);
      if (actual?.estado === 'activo') setResumen(await resumenPos(empresa.id));
    } catch (e) {
      if (!silencioso) { toast.error((e as Error).message); setVinculo(null); }
    }
  }, [empresa.id, empresa.nombre_comercial, empresa.razon_social]);
  useEffect(() => { void cargar(); }, [cargar]);

  // Mientras el código espera se revisa cada 5 s para ver la conexión apenas
  // ocurre; ya conectada, cada 20 s para que los contadores se muevan solos.
  // Con la pestaña oculta no se pregunta nada.
  const estado = vinculo?.estado;
  useEffect(() => {
    if (estado !== 'pendiente' && estado !== 'activo') return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void cargar(true);
    }, estado === 'pendiente' ? 5_000 : 20_000);
    return () => window.clearInterval(id);
  }, [estado, cargar]);

  const generar = async () => {
    setTrabajando(true);
    try {
      await generarCodigoPos(empresa.id);
      await cargar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pude generar el código');
    } finally {
      setTrabajando(false);
    }
  };

  const desconectar = async () => {
    if (!window.confirm('¿Desconectar Codec POS de esta empresa? Dejarán de llegar sus ventas. Lo que ya llegó se conserva.')) return;
    setTrabajando(true);
    try { await desconectarPos(empresa.id); await cargar(); toast.success('Desconectada'); } catch (e) { toast.error((e as Error).message); } finally { setTrabajando(false); }
  };

  if (vinculo === undefined) return <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-slate-300" /></div>;

  if (vinculo?.estado === 'activo') {
    const recibiendo = posRecibiendo(vinculo.ultimo_envio_at);
    const cifras: Array<[string, number | undefined]> = [
      ['Ventas', resumen?.ventas], ['Gastos', resumen?.gastos], ['Devoluciones', resumen?.devoluciones],
      ['Cierres de caja', resumen?.cierres], ['Documentos electrónicos', resumen?.documentos],
    ];
    return (
      <div>
        <div className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-white ring-1 ring-emerald-200">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3.5">
            <span className="relative flex size-3 shrink-0">
              {recibiendo && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
              <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-emerald-900">
                Conectada con Codec POS{vinculo.nombre_negocio ? ` · ${vinculo.nombre_negocio}` : ''}
              </p>
              <p className="text-xs text-emerald-800">
                {vinculo.ultimo_envio_at
                  ? `${recibiendo ? 'Recibiendo información ahora' : 'Conexión activa'} · último envío ${haceCuanto(vinculo.ultimo_envio_at)}`
                  : 'Conexión activa · esperando el primer envío de Codec POS'}
                {vinculo.vinculado_at ? ` · conectada desde el ${new Date(vinculo.vinculado_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}` : ''}
              </p>
            </div>
            {puedeEditar && (
              <button type="button" onClick={() => void desconectar()} disabled={trabajando} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-600">
                <Unplug className="size-3.5" /> Desconectar
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-px border-t border-emerald-100 bg-emerald-100 sm:grid-cols-5">
            {cifras.map(([nombre, valor]) => (
              <div key={nombre} className="bg-white/90 px-3 py-2.5 text-center">
                <p className="text-lg font-black tabular-nums text-slate-900">{valor === undefined ? '…' : valor.toLocaleString('es-CO')}</p>
                <p className="text-[10.5px] font-semibold text-slate-500">{nombre}</p>
              </div>
            ))}
          </div>
        </div>
        <SeccionesPos empresa={empresa} periodo={periodo} puedeEditar={puedeEditar} />
      </div>
    );
  }

  const nombre = empresa.nombre_comercial || empresa.razon_social;
  const mensajeCodigo = vinculo?.codigo
    ? encodeURIComponent(
      `Hola, para que tus ventas de Codec POS me lleguen directo a la contabilidad de ${nombre}: abre Codec POS, `
      + `entra a Configuración > Mi contador y pega este código: ${vinculo.codigo}. Vence en 7 días.`,
    )
    : '';
  const mensajeRecomendar = encodeURIComponent(
    `Hola, soy tu contador. Te recomiendo Codec POS para las ventas, el inventario y la caja de ${nombre}: `
    + 'funciona en el celular y en el computador, incluso sin internet, y tus ventas me llegan directo a la contabilidad. '
    + 'Míralo aquí: https://pos.codecstudio.online',
  );
  const telefono = (empresa.telefono ?? '').replace(/[^0-9]/g, '').replace(/^(3\d{9})$/, '57$1');

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <div>
        {/* El título y el logo ya están en la cabecera de la sección: aquí
            se repetían y la tarjeta arrancaba con dos títulos seguidos. */}
        {anterior && (
          <div className="mb-4 flex gap-2.5 rounded-2xl bg-amber-50 px-4 py-3 text-[13px] text-amber-900 ring-1 ring-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <p>
              <strong>La conexión con Codec POS{anterior.nombre_negocio ? ` (${anterior.nombre_negocio})` : ''} se desconectó</strong>
              {anterior.updated_at ? ` el ${new Date(anterior.updated_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}.
              {' '}Lo que ya llegó ({anterior.eventos_recibidos.toLocaleString('es-CO')} registros) se conserva, pero no llegará nada nuevo hasta que tu cliente
              pegue un código nuevo en Codec POS. Al reconectar, Codec POS reenvía lo que falte sin duplicar.
            </p>
          </div>
        )}
        <p className="text-sm font-bold text-slate-900">Si {nombre} usa Codec POS, conéctala una vez y listo:</p>
        <ul className="mt-3 space-y-3 text-[13px] text-slate-600">
          <li className="flex gap-2.5"><ReceiptText className="mt-0.5 size-4 shrink-0 text-orange-500" />Cada factura, nota crédito y documento soporte electrónico llega con su XML, listo para causar.</li>
          <li className="flex gap-2.5"><Store className="mt-0.5 size-4 shrink-0 text-orange-500" />Cada venta, con o sin factura, con sus productos, su IVA y su medio de pago, y las devoluciones.</li>
          <li className="flex gap-2.5"><Wallet className="mt-0.5 size-4 shrink-0 text-orange-500" />Los gastos que paga el negocio y el cierre de caja de cada turno, con su diferencia.</li>
          <li className="flex gap-2.5"><Zap className="mt-0.5 size-4 shrink-0 text-orange-500" />Con un clic las ventas del día se vuelven comprobante de ventas (VP) y los gastos, de egreso (CE).</li>
        </ul>

        {puedeEditar && (
          <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50/60 p-4">
            {vinculo?.codigo ? (
              <>
                <p className="text-xs font-bold uppercase tracking-wide text-orange-700">Código de conexión</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-xl bg-white px-4 py-2 font-mono text-xl font-black tracking-widest text-slate-900 ring-1 ring-orange-200">{vinculo.codigo}</span>
                  <button
                    type="button"
                    onClick={() => { void navigator.clipboard.writeText(vinculo.codigo!); toast.success('Código copiado'); }}
                    className="flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    <Copy className="size-3.5" /> Copiar
                  </button>
                  <a
                    href={`https://wa.me/${telefono}?text=${mensajeCodigo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    <MessageCircle className="size-3.5" /> Enviar por WhatsApp
                  </a>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-orange-900">
                  Tu cliente lo pega en Codec POS, en Configuración {'>'} Mi contador. Sirve una sola vez y vence el{' '}
                  {vinculo.codigo_vence ? new Date(vinculo.codigo_vence).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }) : ''}.
                  El NIT del negocio debe ser {empresa.nit}.
                </p>
                <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-orange-800">
                  <Loader2 className="size-3.5 animate-spin" /> Esperando a que tu cliente lo pegue. Esta pantalla se actualiza sola.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-900">Conectar con Codec POS</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Genera un código y pásaselo a tu cliente. Al pegarlo en su Codec POS autoriza compartir sus ventas contigo.
                </p>
                <Boton estilo={BOTON_PRIMARIO} className="mt-3 text-white" icono={trabajando ? Loader2 : Link2} disabled={trabajando} onClick={() => void generar()}>
                  Generar código de conexión
                </Boton>
              </>
            )}
          </div>
        )}
      </div>
      <div className="rounded-2xl bg-slate-50 p-5">
        <p className="text-sm font-bold text-slate-900">¿{nombre} todavía no usa Codec POS?</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Recomiéndaselo: ventas, inventario, caja y gastos en el celular o el computador, y su contabilidad te llega sola.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <a
            href={`https://wa.me/${telefono}?text=${mensajeRecomendar}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
          >
            <MessageCircle className="size-4" /> Recomendárselo por WhatsApp
          </a>
          <a
            href="https://pos.codecstudio.online"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
          >
            <ExternalLink className="size-4" /> Ver Codec POS
          </a>
        </div>
      </div>
    </div>
  );
}

function finDeMes(p: string) {
  const [a, m] = p.split('-').map(Number);
  return new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10);
}

function VentasPos({ empresa, periodo, puedeEditar }: { empresa: Empresa; periodo?: string; puedeEditar: boolean }) {
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  const p = periodo ?? hoy.slice(0, 7);
  const [ventas, setVentas] = useState<VentaPos[] | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [contabilizando, setContabilizando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try { setVentas(await ventasPos(empresa.id, `${p}-01`, finDeMes(p))); } catch (e) { toast.error((e as Error).message); setVentas([]); }
  }, [empresa.id, p]);
  useEffect(() => { void cargar(); }, [cargar]);

  const dias = useMemo(() => {
    const m = new Map<string, VentaPos[]>();
    for (const v of ventas ?? []) {
      const d = diaBogota(v.fecha);
      m.set(d, [...(m.get(d) ?? []), v]);
    }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [ventas]);

  const exportar = () => {
    if (!ventas?.length) return;
    const bytes = generarXlsx([{
      nombre: 'Ventas Codec POS',
      encabezados: ['Fecha', 'Número', 'Medio de pago', 'Subtotal', 'IVA', 'Descuento', 'Propina', 'Total', 'Factura electrónica (CUFE)', 'Anulada', 'Cajero', 'Tienda', 'Productos'],
      filas: ventas.map((v) => [
        new Date(v.fecha).toLocaleString('es-CO', { timeZone: 'America/Bogota' }), v.numero ?? '', v.medio_pago ?? '', Number(v.subtotal), Number(v.iva),
        Number(v.descuento), Number(v.propina), Number(v.total), v.factura_cufe ?? '', v.anulada ? 'Sí' : '', v.cajero ?? '', v.tienda ?? '',
        v.items.map((i) => `${i.cantidad} x ${i.nombre}`).join('; '),
      ] as ValorCelda[]),
      anchos: [20, 10, 14, 14, 12, 12, 12, 14, 40, 8, 18, 16, 60],
    }]);
    void triggerDownload(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `Ventas Codec POS ${empresa.nombre_comercial || empresa.razon_social} ${p}.xlsx`.replace(/[\\/:*?"<>|]/g, ''));
  };

  const contabilizar = async (dia: string) => {
    setContabilizando(dia);
    try {
      const r = await contabilizarDiaPos(empresa.id, dia);
      if (r.ventas === 0 && !r.devoluciones) toast.message('No hay ventas sin factura pendientes de ese día');
      else toast.success(`VP-${r.numero} creado con ${r.ventas} ventas${r.devoluciones ? ` y ${r.devoluciones} devoluciones` : ''}`);
      await cargar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pude contabilizar');
    } finally {
      setContabilizando(null);
    }
  };

  if (ventas === null) return <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-slate-300" /></div>;
  if (ventas.length === 0) {
    return <Vacio icono={Store} titulo="Sin ventas de Codec POS este mes" descripcion="Cuando el negocio venda, sus ventas llegan aquí solas." />;
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Boton estilo={BOTON_NEUTRO} className="text-slate-700" icono={Download} onClick={exportar}>Excel del mes</Boton>
      </div>
      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
        {dias.map(([dia, lista]) => {
          const vivas = lista.filter((v) => !v.anulada);
          const total = vivas.reduce((s, v) => s + Number(v.total), 0);
          const porMedio = new Map<string, number>();
          for (const v of vivas) porMedio.set(v.medio_pago || 'otro', (porMedio.get(v.medio_pago || 'otro') ?? 0) + Number(v.total));
          const pendientes = vivas.filter((v) => !v.factura_cufe && !v.comprobante_id).length;
          return (
            <div key={dia}>
              <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                <button type="button" onClick={() => setAbierto(abierto === dia ? null : dia)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <ChevronDown className={`size-4 shrink-0 text-slate-300 transition ${abierto === dia ? 'rotate-180' : ''}`} />
                  <span className="w-28 shrink-0 text-sm font-bold text-slate-800">
                    {new Date(`${dia}T12:00:00`).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <span className="text-xs text-slate-500">{vivas.length} ventas · {[...porMedio.entries()].map(([m, v]) => `${m} ${pesos(v)}`).join(' · ')}</span>
                </button>
                <span className="text-sm font-black tabular-nums text-slate-900">{pesos(total)}</span>
                {puedeEditar && (pendientes > 0 ? (
                  <Boton estilo={BOTON_EXITO} className="px-3 py-1.5 text-xs text-white" icono={contabilizando === dia ? Loader2 : BookOpenCheck} disabled={contabilizando !== null} onClick={() => void contabilizar(dia)}>
                    Contabilizar día
                  </Boton>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Contabilizado</span>
                ))}
              </div>
              {abierto === dia && (
                <div className="overflow-x-auto bg-slate-50/60 px-4 pb-3">
                  <table className="w-full text-[12.5px]" translate="no">
                    <thead><tr className="text-left text-slate-400"><th className="py-1.5 pr-3">Hora</th><th className="py-1.5 pr-3">N.º</th><th className="py-1.5 pr-3">Productos</th><th className="py-1.5 pr-3">Pago</th><th className="py-1.5 pr-3 text-right">IVA</th><th className="py-1.5 pr-3 text-right">Total</th><th className="py-1.5">Estado</th></tr></thead>
                    <tbody>
                      {lista.map((v) => (
                        <tr key={v.id} className={`border-t border-slate-100 ${v.anulada ? 'text-slate-300 line-through' : ''}`}>
                          <td className="py-1.5 pr-3">{new Date(v.fecha).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="py-1.5 pr-3 font-mono">{v.numero}</td>
                          <td className="max-w-[260px] truncate py-1.5 pr-3">{v.items.map((i) => `${i.cantidad} ${i.nombre}`).join(', ')}</td>
                          <td className="py-1.5 pr-3">{v.medio_pago}</td>
                          <td className="py-1.5 pr-3 text-right tabular-nums">{pesos(Number(v.iva))}</td>
                          <td className="py-1.5 pr-3 text-right font-semibold tabular-nums">{pesos(Number(v.total))}</td>
                          <td className="py-1.5 text-[11px]">{v.anulada ? 'Anulada' : v.factura_cufe ? 'Con factura electrónica' : v.comprobante_id ? 'En VP' : 'Pendiente'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
        «Contabilizar día» crea un comprobante VP con las ventas sin factura electrónica, menos las devoluciones sin nota crédito:
        efectivo a 110505, otros medios a 111005, ingresos a 413595 e IVA a 240805. Las ventas con factura se causan desde su XML, en la carpeta Ventas.
      </p>
    </div>
  );
}

// ── Pestañas de lo que manda Codec POS ────────────────────────────────────

type Seccion = 'ventas' | 'gastos' | 'devoluciones' | 'cierres';

const SECCIONES: Array<{ id: Seccion; nombre: string; icono: typeof Store }> = [
  { id: 'ventas', nombre: 'Ventas', icono: Store },
  { id: 'gastos', nombre: 'Gastos', icono: Wallet },
  { id: 'devoluciones', nombre: 'Devoluciones', icono: Undo2 },
  { id: 'cierres', nombre: 'Cierres de caja', icono: Calculator },
];

function SeccionesPos({ empresa, periodo, puedeEditar }: { empresa: Empresa; periodo?: string; puedeEditar: boolean }) {
  const [seccion, setSeccion] = useState<Seccion>('ventas');
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist">
        {SECCIONES.map(({ id, nombre, icono: Icono }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={seccion === id}
            onClick={() => setSeccion(id)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              seccion === id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            <Icono className="size-3.5" /> {nombre}
          </button>
        ))}
      </div>
      {seccion === 'ventas' && <VentasPos empresa={empresa} periodo={periodo} puedeEditar={puedeEditar} />}
      {seccion === 'gastos' && <GastosPosLista empresa={empresa} periodo={periodo} puedeEditar={puedeEditar} />}
      {seccion === 'devoluciones' && <DevolucionesPosLista empresa={empresa} periodo={periodo} />}
      {seccion === 'cierres' && <CierresPosLista empresa={empresa} periodo={periodo} />}
    </div>
  );
}

const periodoDe = (periodo?: string) => periodo ?? new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }).slice(0, 7);
const nombreArchivo = (texto: string) => texto.replace(/[\\/:*?"<>|]/g, '');
const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' });
const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', weekday: 'short', day: 'numeric', month: 'short' });

function descargarXlsx(nombre: string, hoja: Parameters<typeof generarXlsx>[0][number]) {
  const bytes = generarXlsx([hoja]);
  void triggerDownload(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nombreArchivo(nombre));
}

function GastosPosLista({ empresa, periodo, puedeEditar }: { empresa: Empresa; periodo?: string; puedeEditar: boolean }) {
  const p = periodoDe(periodo);
  const [gastos, setGastos] = useState<GastoPos[] | null>(null);
  const [contabilizando, setContabilizando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try { setGastos(await gastosPos(empresa.id, `${p}-01`, finDeMes(p))); } catch (e) { toast.error((e as Error).message); setGastos([]); }
  }, [empresa.id, p]);
  useEffect(() => { void cargar(); }, [cargar]);

  const dias = useMemo(() => {
    const m = new Map<string, GastoPos[]>();
    for (const g of gastos ?? []) m.set(diaBogota(g.fecha), [...(m.get(diaBogota(g.fecha)) ?? []), g]);
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [gastos]);

  const contabilizar = async (dia: string) => {
    setContabilizando(dia);
    try {
      const r = await contabilizarGastosDiaPos(empresa.id, dia);
      if (r.gastos === 0) toast.message('No hay gastos pendientes de ese día');
      else toast.success(`CE-${r.numero} creado con ${r.gastos} gastos`);
      await cargar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pude contabilizar');
    } finally {
      setContabilizando(null);
    }
  };

  if (gastos === null) return <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-slate-300" /></div>;
  if (gastos.length === 0) return <Vacio icono={Wallet} titulo="Sin gastos de Codec POS este mes" descripcion="Los gastos que el negocio registre en su caja llegan aquí solos." />;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Boton
          estilo={BOTON_NEUTRO}
          className="text-slate-700"
          icono={Download}
          onClick={() => descargarXlsx(`Gastos Codec POS ${empresa.nombre_comercial || empresa.razon_social} ${p}.xlsx`, {
            nombre: 'Gastos Codec POS',
            encabezados: ['Fecha', 'Concepto', 'Categoría', 'Proveedor', 'NIT proveedor', 'Soporte', 'Medio de pago', 'Base', 'IVA', 'Valor', 'Anulado', 'Cajero', 'Tienda'],
            filas: gastos.map((g) => [
              new Date(g.fecha).toLocaleString('es-CO', { timeZone: 'America/Bogota' }), g.concepto ?? '', g.categoria ?? '', g.proveedor_nombre ?? '',
              g.proveedor_nit ?? '', g.numero_soporte ?? '', g.medio_pago ?? '', Number(g.valor) - Number(g.iva), Number(g.iva), Number(g.valor),
              g.anulado ? 'Sí' : '', g.cajero ?? '', g.tienda ?? '',
            ] as ValorCelda[]),
            anchos: [20, 36, 18, 28, 14, 14, 14, 14, 12, 14, 8, 18, 16],
          })}
        >
          Excel del mes
        </Boton>
      </div>
      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
        {dias.map(([dia, lista]) => {
          const vivos = lista.filter((g) => !g.anulado);
          const pendientes = vivos.filter((g) => !g.comprobante_id).length;
          return (
            <div key={dia} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="w-28 shrink-0 text-sm font-bold text-slate-800">{fechaCorta(`${dia}T12:00:00-05:00`)}</span>
                <span className="min-w-0 flex-1 text-xs text-slate-500">{vivos.length} gastos</span>
                <span className="text-sm font-black tabular-nums text-slate-900">{pesos(vivos.reduce((s, g) => s + Number(g.valor), 0))}</span>
                {puedeEditar && (pendientes > 0 ? (
                  <Boton estilo={BOTON_EXITO} className="px-3 py-1.5 text-xs text-white" icono={contabilizando === dia ? Loader2 : BookOpenCheck} disabled={contabilizando !== null} onClick={() => void contabilizar(dia)}>
                    Contabilizar gastos
                  </Boton>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Contabilizado</span>
                ))}
              </div>
              <ul className="mt-2 space-y-1 text-[12.5px] text-slate-600">
                {lista.map((g) => (
                  <li key={g.id} className={`flex gap-3 ${g.anulado ? 'text-slate-300 line-through' : ''}`}>
                    <span className="w-12 shrink-0 tabular-nums text-slate-400">{hora(g.fecha)}</span>
                    <span className="min-w-0 flex-1 truncate">
                      {g.concepto || g.categoria || 'Gasto'}{g.proveedor_nombre ? ` · ${g.proveedor_nombre}` : ''}{g.medio_pago ? ` · ${g.medio_pago}` : ''}
                    </span>
                    <span className="font-semibold tabular-nums">{pesos(Number(g.valor))}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
        «Contabilizar gastos» crea un comprobante de egreso (CE): el gasto a 519595, el IVA a 240810 y el pago a 110505 (efectivo) o 111005.
        Puedes ajustar las cuentas en el comprobante.
      </p>
    </div>
  );
}

function DevolucionesPosLista({ empresa, periodo }: { empresa: Empresa; periodo?: string }) {
  const p = periodoDe(periodo);
  const [devoluciones, setDevoluciones] = useState<DevolucionPos[] | null>(null);
  useEffect(() => {
    devolucionesPos(empresa.id, `${p}-01`, finDeMes(p)).then(setDevoluciones).catch((e) => { toast.error((e as Error).message); setDevoluciones([]); });
  }, [empresa.id, p]);

  if (devoluciones === null) return <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-slate-300" /></div>;
  if (devoluciones.length === 0) return <Vacio icono={Undo2} titulo="Sin devoluciones este mes" descripcion="Si el negocio devuelve una venta, aparece aquí y se descuenta en el VP de ese día." />;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full text-[12.5px]" translate="no">
        <thead><tr className="bg-slate-50 text-left text-slate-400"><th className="px-4 py-2">Fecha</th><th className="py-2 pr-3">Productos</th><th className="py-2 pr-3">Motivo</th><th className="py-2 pr-3">Reembolso</th><th className="py-2 pr-3 text-right">Total</th><th className="py-2 pr-4">Estado</th></tr></thead>
        <tbody>
          {devoluciones.map((d) => (
            <tr key={d.id} className={`border-t border-slate-100 ${d.anulada ? 'text-slate-300 line-through' : ''}`}>
              <td className="px-4 py-2">{fechaCorta(d.fecha)} {hora(d.fecha)}</td>
              <td className="max-w-[240px] truncate py-2 pr-3">{d.items.map((i) => `${i.cantidad} ${i.nombre}`).join(', ')}</td>
              <td className="max-w-[180px] truncate py-2 pr-3">{d.motivo ?? ''}</td>
              <td className="py-2 pr-3">{d.medio_pago ?? ''}</td>
              <td className="py-2 pr-3 text-right font-semibold tabular-nums">{pesos(Number(d.total))}</td>
              <td className="py-2 pr-4 text-[11px]">{d.anulada ? 'Anulada' : d.nota_credito_cufe ? 'Con nota crédito' : d.comprobante_id ? 'En VP' : 'Pendiente'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CierresPosLista({ empresa, periodo }: { empresa: Empresa; periodo?: string }) {
  const p = periodoDe(periodo);
  const [cierres, setCierres] = useState<CierrePos[] | null>(null);
  useEffect(() => {
    cierresPos(empresa.id, `${p}-01`, finDeMes(p)).then(setCierres).catch((e) => { toast.error((e as Error).message); setCierres([]); });
  }, [empresa.id, p]);

  if (cierres === null) return <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-slate-300" /></div>;
  if (cierres.length === 0) return <Vacio icono={Calculator} titulo="Sin cierres de caja este mes" descripcion="Cada cierre de turno en Codec POS llega aquí con su arqueo." />;

  const descuadres = cierres.filter((c) => Math.abs(Number(c.diferencia)) >= 1);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          {cierres.length} cierres · {descuadres.length === 0 ? 'todos cuadraron' : `${descuadres.length} con diferencia`}
        </p>
        <Boton
          estilo={BOTON_NEUTRO}
          className="text-slate-700"
          icono={Download}
          onClick={() => descargarXlsx(`Cierres de caja ${empresa.nombre_comercial || empresa.razon_social} ${p}.xlsx`, {
            nombre: 'Cierres de caja',
            encabezados: ['Apertura', 'Cierre', 'Cajero', 'Tienda', 'Caja', 'Base inicial', 'Ventas', 'Ventas por medio', 'Gastos en efectivo', 'Efectivo esperado', 'Efectivo contado', 'Diferencia', 'N.º ventas', 'Observaciones'],
            filas: cierres.map((c) => [
              c.apertura ? new Date(c.apertura).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : '',
              new Date(c.cierre).toLocaleString('es-CO', { timeZone: 'America/Bogota' }), c.cajero ?? '', c.tienda ?? '', c.caja ?? '',
              Number(c.base_inicial), Number(c.ventas_total), Object.entries(c.ventas_por_medio ?? {}).map(([m, v]) => `${m}: ${v}`).join('; '),
              Number(c.gastos_efectivo), Number(c.efectivo_esperado), Number(c.efectivo_contado), Number(c.diferencia), c.num_ventas, c.observaciones ?? '',
            ] as ValorCelda[]),
            anchos: [20, 20, 18, 16, 10, 14, 14, 40, 14, 14, 14, 12, 10, 40],
          })}
        >
          Excel del mes
        </Boton>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-[12.5px]" translate="no">
          <thead><tr className="bg-slate-50 text-left text-slate-400"><th className="px-4 py-2">Cierre</th><th className="py-2 pr-3">Cajero</th><th className="py-2 pr-3 text-right">Ventas</th><th className="py-2 pr-3 text-right">Esperado</th><th className="py-2 pr-3 text-right">Contado</th><th className="py-2 pr-4 text-right">Diferencia</th></tr></thead>
          <tbody>
            {cierres.map((c) => {
              const dif = Number(c.diferencia);
              return (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{fechaCorta(c.cierre)} {hora(c.cierre)}</td>
                  <td className="py-2 pr-3">{c.cajero ?? ''}{c.tienda ? ` · ${c.tienda}` : ''}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{pesos(Number(c.ventas_total))}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{pesos(Number(c.efectivo_esperado))}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{pesos(Number(c.efectivo_contado))}</td>
                  <td className={`py-2 pr-4 text-right font-bold tabular-nums ${Math.abs(dif) < 1 ? 'text-emerald-600' : dif < 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                    {Math.abs(dif) < 1 ? 'Cuadró' : pesos(dif)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
