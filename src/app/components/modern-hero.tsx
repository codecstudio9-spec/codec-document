import { ArrowRight, Home, ShieldCheck, Briefcase, Settings, Car, TrendingUp, Lock, BadgeCheck, FileCheck2, Clock3, PenLine } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';

/**
 * Portada para visitantes de EE. UU.
 *
 * Rehecha el 2026-10-21. La anterior era un carrusel de cuatro titulares
 * genéricos («Create, Sign & Verify Documents in one secure platform») que
 * rotaban cada 5,5 s, con las tarjetas de documentos pidiendo registro antes
 * de dejar probar nada (aunque /generator/* está abierto a todos) y un botón
 * principal que llevaba a la firma de PDFs en lugar de a crear un documento.
 * En 60 días, ninguna visita real de EE. UU. creó un documento.
 *
 * Ahora: un titular fijo con el resultado que la persona busca, los seis
 * documentos a un clic y sin registro, señales de confianza concretas
 * (E-SIGN/UETA, cifrado, número de documento verificable) y, a la derecha,
 * cómo se ve el documento terminado.
 */

const DOCUMENTOS = [
  { en: 'Lease Agreement', es: 'Contrato de arrendamiento', subEn: 'Residential, any state', subEs: 'Vivienda, cualquier estado', route: '/generator/residential-lease', icon: Home, color: '#2563eb' },
  { en: 'Vehicle Bill of Sale', es: 'Compraventa de vehículo', subEn: 'With odometer disclosure', subEs: 'Con declaración de odómetro', route: '/generator/bill-of-sale-vehicle', icon: Car, color: '#0891b2' },
  { en: 'Non-Disclosure (NDA)', es: 'Confidencialidad (NDA)', subEn: 'Mutual or one-way', subEs: 'Mutuo o unilateral', route: '/generator/nda', icon: ShieldCheck, color: '#7c3aed' },
  { en: 'Service Agreement', es: 'Contrato de servicios', subEn: 'Scope, price, payment terms', subEs: 'Alcance, precio y pagos', route: '/generator/service-agreement', icon: Settings, color: '#0284c7' },
  { en: 'Independent Contractor', es: 'Contratista independiente', subEn: '1099 contractor terms', subEs: 'Términos de contratista 1099', route: '/generator/independent-contractor', icon: Briefcase, color: '#4f46e5' },
  { en: 'Promissory Note', es: 'Pagaré', subEn: 'Loan with payment schedule', subEs: 'Préstamo con plan de pagos', route: '/generator/promissory-note', icon: TrendingUp, color: '#d97706' },
];

function DocumentoTerminado({ en }: { en: boolean }) {
  const fila = (etiqueta: string, valor: string) => (
    <div className="contents">
      <span className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">{etiqueta}</span>
      <span className="text-[10px] font-semibold text-slate-800">{valor}</span>
    </div>
  );
  return (
    <div className="relative w-full max-w-[420px]">
      {/* Hoja de atrás, para dar profundidad */}
      <div className="absolute inset-0 translate-x-4 translate-y-4 rotate-[2deg] rounded-xl bg-white/40" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.45)]">
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#0f2a5f 0%,#0f2a5f 72%,#4f46e5 72%)' }} />
        <div className="flex items-start justify-between border-b border-slate-200 px-5 pb-2 pt-3">
          <span className="text-[10px] font-bold text-[#0f2a5f]">Carter Motors LLC</span>
          <span className="text-right text-[8px] leading-tight text-slate-500">
            <b className="block text-[#0f2a5f]">BILL OF SALE - MOTOR VEHICLE</b>
            Document ID: CDX-2D7C4759
          </span>
        </div>
        <div className="px-5 pb-4 pt-4">
          <p className="text-center text-[13px] font-bold tracking-wide text-[#0f2a5f]">BILL OF SALE - MOTOR VEHICLE</p>
          <div className="mx-auto mt-1.5 h-[2px] w-12 rounded-full bg-indigo-600" />
          <p className="mt-3 text-[9px] font-bold uppercase tracking-wider text-[#0f2a5f]">{en ? 'Seller' : 'Vendedor'}</p>
          <div className="mt-1 grid grid-cols-[70px_1fr] gap-x-3 gap-y-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            {fila(en ? 'Name' : 'Nombre', 'John Carter')}
            {fila(en ? 'Address' : 'Dirección', '120 Ocean Dr, Miami, FL 33139')}
          </div>
          <p className="mt-3 text-[9px] font-bold uppercase tracking-wider text-[#0f2a5f]">{en ? 'Vehicle' : 'Vehículo'}</p>
          <div className="mt-1 grid grid-cols-[70px_1fr] gap-x-3 gap-y-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            {fila(en ? 'Vehicle' : 'Vehículo', '2019 Toyota Camry · Silver')}
            {fila('VIN', '4T1B11HK5KU123456')}
            {fila(en ? 'Price' : 'Precio', 'USD 18,500')}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-5">
            {['John Carter', 'Maria Lopez'].map((n, i) => (
              <div key={n}>
                <div className="flex h-9 items-end">
                  <span className="font-[cursive] text-[19px] leading-none text-slate-800" style={{ fontFamily: '"Brush Script MT","Segoe Script",cursive' }}>{n}</span>
                </div>
                <div className="border-t border-slate-800 pt-1">
                  <p className="text-[8.5px] font-bold uppercase text-slate-800">{n}</p>
                  <p className="text-[7.5px] text-slate-500">{en ? 'Signed electronically' : 'Firmado electrónicamente'} · Oct {21 + i}, 2026</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-2 text-[7.5px]">
          <span className="font-bold text-[#0f2a5f]">Document CDX-2D7C4759</span>
          <span className="font-semibold text-indigo-600">{en ? 'Compliant with E-SIGN & UETA' : 'Conforme a E-SIGN y UETA'}</span>
          <span className="font-bold text-[#0f2a5f]">Page 1 of 4</span>
        </div>
      </div>
      {/* Sello de firmado */}
      <div className="absolute -left-8 bottom-24 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-xl ring-1 ring-slate-200">
        <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500 text-white"><BadgeCheck className="size-4" /></span>
        <span className="text-[11px] font-bold leading-tight text-slate-800">
          {en ? 'Signed by both parties' : 'Firmado por ambas partes'}
          <span className="block text-[10px] font-medium text-slate-500">{en ? 'Audit trail + SHA-256' : 'Auditoría + SHA-256'}</span>
        </span>
      </div>
    </div>
  );
}

export function ModernHero(_props: { onRequireAuth: () => void }) {
  const { language } = useLanguage();
  const en = language === 'en';

  const confianza = [
    { icon: FileCheck2, t: en ? 'E-SIGN Act & UETA compliant' : 'Conforme a E-SIGN y UETA' },
    { icon: Lock, t: en ? 'Encrypted, with audit trail' : 'Cifrado y con auditoría' },
    { icon: BadgeCheck, t: en ? 'Verifiable document ID' : 'N.º de documento verificable' },
    { icon: Clock3, t: en ? 'Ready in about 5 minutes' : 'Listo en unos 5 minutos' },
  ];

  return (
    <section className="bg-white px-3 pt-4 sm:px-5 sm:pt-6 lg:px-8">
      <div
        className="relative mx-auto max-w-[1600px] overflow-hidden rounded-[2rem] sm:rounded-[2.75rem]"
        style={{ background: 'linear-gradient(135deg, #0f2a5f 0%, #1e3a8a 45%, #3730a3 100%)' }}
      >
        <div className="pointer-events-none absolute -left-24 -top-24 size-[26rem] rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 size-[30rem] rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative z-10 grid items-center gap-10 px-5 pb-12 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-[1.15fr_1fr] lg:px-12 lg:py-16 xl:px-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-200">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              {en ? 'Free to start · No credit card · Valid in all 50 states' : 'Gratis para empezar · Sin tarjeta · Válido en los 50 estados'}
            </p>

            <h1 className="mt-4 text-[2rem] font-black leading-[1.08] tracking-tight text-white sm:text-[2.6rem] lg:text-[3.1rem]">
              {en ? <>Create a legally binding<br className="hidden sm:block" /> contract <span className="text-sky-300">in 5 minutes.</span></> : <>Crea un contrato con validez legal <span className="text-sky-300">en 5 minutos.</span></>}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              {en
                ? 'Pick your document, answer a few simple questions, sign it online and download a professional PDF your clients will trust.'
                : 'Elige tu documento, responde unas preguntas sencillas, fírmalo en línea y descarga un PDF profesional que tus clientes van a confiar.'}
            </p>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.14em] text-white/55">
              {en ? 'What do you need to create?' : '¿Qué necesitas crear?'}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {DOCUMENTOS.map((d) => {
                const Icon = d.icon;
                return (
                  <a
                    key={d.route}
                    href={d.route}
                    className="group flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.08] px-3.5 py-3 text-left transition hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/[0.14]"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-lg" style={{ background: d.color }}>
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-bold leading-tight text-white">{en ? d.en : d.es}</span>
                      <span className="block truncate text-xs text-white/55">{en ? d.subEn : d.subEs}</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white" />
                  </a>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              <a href="/electronic-signature" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-200 hover:text-white">
                <PenLine className="size-4" /> {en ? 'Already have a document? Upload and sign it' : '¿Ya tienes tu documento? Súbelo y fírmalo'}
              </a>
            </div>

            <ul className="mt-7 grid grid-cols-1 gap-2 border-t border-white/10 pt-5 sm:grid-cols-2">
              {confianza.map(({ icon: Icon, t }) => (
                <li key={t} className="flex items-center gap-2 text-[13px] font-medium text-white/80">
                  <Icon className="size-4 shrink-0 text-emerald-300" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden justify-center lg:flex">
            <DocumentoTerminado en={en} />
          </div>
        </div>
      </div>
    </section>
  );
}
