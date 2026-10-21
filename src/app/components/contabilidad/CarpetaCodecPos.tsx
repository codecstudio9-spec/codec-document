import { Store, Zap, ReceiptText, Wallet, ExternalLink, MessageCircle } from 'lucide-react';
import type { Empresa } from '../../services/contabilidad-service';

/**
 * La carpeta de Codec POS dentro de cada empresa.
 *
 * Fase 1: explica qué va a llegar aquí y le da al contador cómo ofrecerle
 * Codec POS a su cliente (que es la otra mitad del negocio: cada contador
 * con 10 empresas es un vendedor de 10 licencias). La sincronización real
 * de ventas y gastos entra en la fase siguiente.
 */
export function CarpetaCodecPos({ empresa }: { empresa: Empresa }) {
  const nombre = empresa.nombre_comercial || empresa.razon_social;
  const mensaje = encodeURIComponent(
    `Hola, soy tu contador. Te recomiendo Codec POS para las ventas, el inventario y la caja de ${nombre}: `
    + 'funciona en el celular y en el computador, incluso sin internet, y tus ventas me llegan directo a la contabilidad. '
    + 'Míralo aquí: https://pos.codecstudio.online',
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg,#EA580C,#F97316)' }}>
            <Store className="size-6 text-white" />
          </div>
          <div>
            <p className="text-base font-black text-slate-900">Ventas y gastos de Codec POS, directo aquí</p>
            <p className="text-xs text-slate-500">Para las empresas que usan Codec POS en su negocio</p>
          </div>
        </div>
        <ul className="mt-4 space-y-3 text-[13px] text-slate-600">
          <li className="flex gap-2.5"><ReceiptText className="mt-0.5 size-4 shrink-0 text-orange-500" />Cada venta, con o sin factura electrónica, llega a esta carpeta con su IVA y medio de pago.</li>
          <li className="flex gap-2.5"><Wallet className="mt-0.5 size-4 shrink-0 text-orange-500" />Los gastos y los cierres de caja del negocio, sin pedirle nada al cliente.</li>
          <li className="flex gap-2.5"><Zap className="mt-0.5 size-4 shrink-0 text-orange-500" />Con un clic se vuelven comprobantes de ventas (VP) en la contabilidad de {nombre}.</li>
        </ul>
        <p className="mt-4 rounded-xl bg-orange-50 px-3.5 py-2.5 text-xs leading-relaxed text-orange-900 ring-1 ring-orange-200">
          La conexión se está terminando. Cuando esté lista, tu cliente la autoriza desde su Codec POS (sus datos sólo se
          comparten con su permiso) y aquí empiezan a llegar sus movimientos.
        </p>
      </div>
      <div className="rounded-2xl bg-slate-50 p-5">
        <p className="text-sm font-bold text-slate-900">¿{nombre} todavía no usa Codec POS?</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Recomiéndaselo: ventas, inventario, caja y gastos en el celular o el computador, y su contabilidad te llega sola.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <a
            href={`https://wa.me/${(empresa.telefono ?? '').replace(/[^0-9]/g, '').replace(/^(3\d{9})$/, '57$1')}?text=${mensaje}`}
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
