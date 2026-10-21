import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Store, Zap, ReceiptText, ExternalLink, MessageCircle, Loader2, Copy, Link2, Unplug, CheckCircle2,
  Download, BookOpenCheck, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Boton, Vacio } from '../dian/PiezasPanel';
import { BOTON_PRIMARIO, BOTON_NEUTRO, BOTON_EXITO } from '../../styles/contador-theme';
import {
  vinculoPos, generarCodigoPos, desconectarPos, ventasPos, contabilizarDiaPos,
  type Empresa, type VinculoPos, type VentaPos,
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
 * Conectada: las ventas por día con su medio de pago, y un botón por día que
 * las vuelve comprobante de ventas (VP). Las ventas con factura electrónica
 * no entran al VP: su XML llega aparte y se causa como cualquier factura.
 */

const pesos = (v: number) => v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const diaBogota = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

export function CarpetaCodecPos({ empresa, periodo, puedeEditar = true }: { empresa: Empresa; periodo?: string; puedeEditar?: boolean }) {
  const [vinculo, setVinculo] = useState<VinculoPos | null | undefined>(undefined);
  const [trabajando, setTrabajando] = useState(false);

  const cargar = useCallback(async () => {
    try { setVinculo(await vinculoPos(empresa.id)); } catch (e) { toast.error((e as Error).message); setVinculo(null); }
  }, [empresa.id]);
  useEffect(() => { void cargar(); }, [cargar]);

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
    return (
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1 text-sm text-emerald-900">
            <strong>Conectada con Codec POS</strong>
            {vinculo.nombre_negocio ? ` (${vinculo.nombre_negocio})` : ''}.
            {vinculo.ultimo_envio_at
              ? ` Último envío: ${new Date(vinculo.ultimo_envio_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}.`
              : ' Esperando el primer envío.'}
          </div>
          {puedeEditar && (
            <button type="button" onClick={() => void desconectar()} disabled={trabajando} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-600">
              <Unplug className="size-3.5" /> Desconectar
            </button>
          )}
        </div>
        <VentasPos empresa={empresa} periodo={periodo} puedeEditar={puedeEditar} />
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
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg,#EA580C,#F97316)' }}>
            <Store className="size-6 text-white" />
          </div>
          <div>
            <p className="text-base font-black text-slate-900">Las ventas de Codec POS, directo aquí</p>
            <p className="text-xs text-slate-500">Si {nombre} usa Codec POS, conéctala una vez y listo</p>
          </div>
        </div>
        <ul className="mt-4 space-y-3 text-[13px] text-slate-600">
          <li className="flex gap-2.5"><ReceiptText className="mt-0.5 size-4 shrink-0 text-orange-500" />Cada factura electrónica llega con su XML a la carpeta de Ventas, lista para causar.</li>
          <li className="flex gap-2.5"><Store className="mt-0.5 size-4 shrink-0 text-orange-500" />Cada venta, con o sin factura, con sus productos, su IVA y su medio de pago.</li>
          <li className="flex gap-2.5"><Zap className="mt-0.5 size-4 shrink-0 text-orange-500" />Con un clic las ventas del día se vuelven comprobante de ventas (VP).</li>
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
                <button type="button" onClick={() => void cargar()} className="mt-2 text-xs font-bold text-orange-700 hover:underline">Ya lo pegó, revisar</button>
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
      if (r.ventas === 0) toast.message('No hay ventas sin factura pendientes de ese día');
      else toast.success(`VP-${r.numero} creado con ${r.ventas} ventas`);
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
        «Contabilizar día» crea un comprobante VP con las ventas sin factura electrónica: efectivo a 110505, otros medios a 111005,
        ingresos a 413595 e IVA a 240805. Las ventas con factura se causan desde su XML, en la carpeta Ventas.
      </p>
    </div>
  );
}
