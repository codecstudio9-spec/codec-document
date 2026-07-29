import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, FileType2, PenLine, ListChecks, Fingerprint } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';

type Tab = 'build' | 'sign' | 'fill';

const CONTENT = {
  build: {
    en: {
      title: 'How to build a template',
      steps: [
        { h: 'Write your document in Word', b: 'Open Microsoft Word (or any editor that saves .docx) and write your contract normally.' },
        { h: 'Mark every fillable spot with {{double braces}}', b: 'e.g. {{client_name}}, {{start_date}}. Use a different variable name for each person — if you used {{full_name}} for the client, use something like {{witness_name}} for the witness, or both will get the same value.' },
        { h: 'Add a type hint if you need one (optional)', b: '{{signing_date:date}} shows a date picker. {{payment_method:Cash;Card;Transfer}} shows a dropdown with those exact options, separated by semicolons. No hint = a plain text box.' },
        { h: 'Save as .docx and upload it', b: 'Go to My Templates → New Template → Word with {{variables}}. We detect every {{variable}} automatically — you can still relabel or reclassify any of them before saving.' },
        { h: 'Define your signers', b: '"Signer 1" is always the person who opens the public link (variable — you can\'t pre-fill their name). Add any other signer who is always the same person for this template (e.g. your own company rep) as a "fixed" signer with their name/email already filled in.' },
        { h: 'Turn on the security you need', b: 'Selfie, ID photo, ESIGN consent, or biometric (fingerprint/Face ID) — same toggles used everywhere else on Codec Document.' },
        { h: 'Save and share the link', b: 'The link is permanent — everyone who opens it gets their own individually generated, signed document.' },
      ],
    },
    es: {
      title: 'Cómo construir una plantilla',
      steps: [
        { h: 'Escribe tu documento en Word', b: 'Abre Microsoft Word (o cualquier editor que guarde .docx) y redacta tu contrato normalmente.' },
        { h: 'Marca cada campo rellenable con {{llaves dobles}}', b: 'ej. {{nombre_cliente}}, {{fecha_inicio}}. Usa un nombre de variable diferente para cada persona — si usaste {{nombre_completo}} para el cliente, usa algo como {{nombre_testigo}} para el testigo, o ambos recibirán el mismo valor.' },
        { h: 'Agrega una pista de tipo si la necesitas (opcional)', b: '{{fecha_firma:fecha}} muestra un selector de fecha. {{metodo_pago:Efectivo;Tarjeta;Transferencia}} muestra opciones exactas separadas por punto y coma. Sin pista = una casilla de texto normal.' },
        { h: 'Guarda como .docx y súbelo', b: 'Ve a Mis Plantillas → Nueva Plantilla → Word con {{variables}}. Detectamos cada {{variable}} automáticamente — puedes cambiar el nombre o el tipo de cualquiera antes de guardar.' },
        { h: 'Define tus firmantes', b: '"Firmante 1" siempre es quien abre el enlace público (variable — no puedes prellenar su nombre). Agrega cualquier otro firmante que siempre sea la misma persona en esta plantilla (ej. tu propio representante) como firmante "fijo" con su nombre/correo ya puestos.' },
        { h: 'Activa la seguridad que necesites', b: 'Selfie, foto de identificación, consentimiento ESIGN, o biometría (huella/Face ID) — los mismos interruptores que se usan en el resto de Codec Document.' },
        { h: 'Guarda y comparte el enlace', b: 'El enlace es permanente — cada persona que lo abre obtiene su propio documento generado y firmado individualmente.' },
      ],
    },
  },
  sign: {
    en: {
      title: 'What the final client sees when signing',
      steps: [
        { h: 'They open your link', b: 'No account needed — the link works for anyone, anytime.' },
        { h: 'They fill in their information', b: 'Only the fields you left as variables show up — dates, choices, and text boxes, exactly as you configured them.' },
        { h: 'If you required it, they verify their identity', b: 'A selfie, a photo of their ID, or their device\'s own fingerprint/Face ID (WebAuthn) — whichever you turned on. Their biometric data never reaches our servers; only a cryptographic confirmation does.' },
        { h: 'They draw or type their signature', b: 'Same signature pad used everywhere on Codec Document.' },
        { h: 'They\'re done', b: 'Their signed document appears in your document panel automatically — you download it from there.' },
      ],
    },
    es: {
      title: 'Lo que ve el cliente final al firmar',
      steps: [
        { h: 'Abre tu enlace', b: 'No necesita cuenta — el enlace funciona para cualquiera, en cualquier momento.' },
        { h: 'Llena su información', b: 'Solo aparecen los campos que dejaste como variables — fechas, opciones y casillas de texto, tal como los configuraste.' },
        { h: 'Si lo requeriste, verifica su identidad', b: 'Una selfie, una foto de su identificación, o la huella/Face ID de su propio dispositivo (WebAuthn) — lo que hayas activado. Sus datos biométricos nunca llegan a nuestros servidores, solo una confirmación criptográfica.' },
        { h: 'Dibuja o escribe su firma', b: 'El mismo panel de firma que se usa en todo Codec Document.' },
        { h: 'Termina', b: 'Su documento firmado aparece automáticamente en tu panel de documentos — lo descargas desde ahí.' },
      ],
    },
  },
  fill: {
    en: {
      title: 'Reusing an already-made template',
      steps: [
        { h: 'Find your link anytime', b: 'Go to My Templates — every Word template shows its public link with a copy button.' },
        { h: 'Edit fields, signers, or security later', b: 'Open a template and hit Edit — you can relabel fields, add/remove fixed signers, or change the security requirements without affecting documents already signed.' },
        { h: 'The original Word file itself is fixed', b: 'If you need to change the document\'s actual text, create a new template from an updated .docx — this keeps every already-signed document exactly as it was signed, which matters for its legal validity.' },
      ],
    },
    es: {
      title: 'Reusar una plantilla ya hecha',
      steps: [
        { h: 'Encuentra tu enlace cuando quieras', b: 'Ve a Mis Plantillas — cada plantilla Word muestra su enlace público con un botón para copiarlo.' },
        { h: 'Edita campos, firmantes o seguridad después', b: 'Abre una plantilla y toca Editar — puedes renombrar campos, agregar/quitar firmantes fijos, o cambiar los requisitos de seguridad sin afectar los documentos que ya se firmaron.' },
        { h: 'El archivo de Word original es fijo', b: 'Si necesitas cambiar el texto real del documento, crea una plantilla nueva a partir de un .docx actualizado — esto mantiene cada documento ya firmado exactamente como se firmó, lo cual importa para su validez legal.' },
      ],
    },
  },
};

const TABS: Array<{ key: Tab; icon: typeof FileType2; en: string; es: string }> = [
  { key: 'build', icon: FileType2, en: 'Build a template', es: 'Construir una plantilla' },
  { key: 'sign', icon: PenLine, en: 'Signing (client view)', es: 'Firmar (vista del cliente)' },
  { key: 'fill', icon: ListChecks, en: 'Reuse a template', es: 'Reusar una plantilla' },
];

export function MyTemplatesHelpPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('build');
  const data = CONTENT[tab][language];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-2xl">
        <button type="button" onClick={() => navigate('/my-templates')} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700">
          <ArrowLeft className="size-4" />
          {language === 'en' ? 'My Templates' : 'Mis Plantillas'}
        </button>

        <h1 className="text-2xl font-black text-slate-900">{language === 'en' ? 'Templates — Help' : 'Plantillas — Ayuda'}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {language === 'en'
            ? 'Create documents in seconds from templates saved on the platform.'
            : 'Crea documentos en segundos a partir de plantillas guardadas en la plataforma.'}
        </p>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={[
                  'flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition',
                  active ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 hover:bg-slate-100',
                ].join(' ')}
              >
                <Icon className="size-3.5" />
                {t[language]}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">{data.title}</h2>
          <ol className="space-y-4">
            {data.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700">{i + 1}</span>
                <div>
                  <p className="text-sm font-bold text-slate-800">{step.h}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{step.b}</p>
                </div>
              </li>
            ))}
          </ol>
          {tab === 'sign' && (
            <div className="mt-5 flex items-start gap-2 rounded-2xl bg-pink-50 p-3 text-xs text-pink-800">
              <Fingerprint className="mt-0.5 size-4 shrink-0" />
              <p>
                {language === 'en'
                  ? 'Biometric verification uses WebAuthn/FIDO2 — the industry standard behind Touch ID, Face ID, and Windows Hello.'
                  : 'La verificación biométrica usa WebAuthn/FIDO2 — el estándar de la industria detrás de Touch ID, Face ID y Windows Hello.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
