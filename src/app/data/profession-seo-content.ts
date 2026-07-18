// Fase 4 del proyecto LatAm SEO — 8 landing pages por profesión/sector.
// Cada una lista casos de uso REALES y específicos de ese sector (no
// una lista genérica reciclada con el nombre de la profesión pegado
// encima), para que el contenido realmente sea distinto entre las 8 y
// no un riesgo de contenido duplicado.

import type { LucideIcon } from 'lucide-react';
import {
  Scale, Building2, Briefcase, Users, Laptop, HardHat, Calculator, Lightbulb,
} from 'lucide-react';

export interface ProfessionConfig {
  slug: string;
  icon: LucideIcon;
  color: string;
  badgeEs: string;
  h1AccentEs: string;
  h1RestEs: string;
  titleEs: string;
  descEs: string;
  painPointEs: string;
  useCasesEs: string[];
  includedHeadingEs: string;
  includedBodyEs: string;
  faqQEs: string;
  faqAEs: string;
}

export const PROFESSION_PAGES: ProfessionConfig[] = [
  {
    slug: 'abogados',
    icon: Scale, color: '#1e3a8a',
    badgeEs: 'PARA ABOGADOS',
    h1AccentEs: 'Firma Electrónica', h1RestEs: 'para Abogados y Firmas Legales',
    titleEs: 'Firma Electrónica para Abogados | Evidencia Admisible — CodecDocument',
    descEs: 'Firma electrónica para abogados y firmas legales, con la pista de auditoría que necesitas si algún día debes demostrar autenticidad ante un tribunal.',
    painPointEs: 'Cuando envías un contrato de representación o un acuerdo a un cliente, necesitas algo más que una firma dibujada — necesitas poder demostrar quién firmó, cuándo, y que el documento no cambió después.',
    useCasesEs: [
      'Contratos de prestación de servicios legales y acuerdos de honorarios.',
      'Acuerdos de confidencialidad (NDA) con clientes y contrapartes.',
      'Poderes y autorizaciones firmadas a distancia.',
      'Actas y minutas que requieren firma de varias partes.',
    ],
    includedHeadingEs: 'Evidencia pensada para sostenerse ante un cuestionamiento',
    includedBodyEs: 'Cada firma queda respaldada por identidad verificada, hash SHA-256 y registro de IP/fecha/hora — el mismo estándar de evidencia que te gustaría ver si tuvieras que defender la autenticidad de un documento firmado.',
    faqQEs: '¿La firma electrónica sirve como prueba en un proceso judicial?',
    faqAEs: 'La mayoría de las leyes de firma electrónica de la región reconocen el principio de equivalencia funcional: un documento firmado electrónicamente, con evidencia de identidad y una pista de auditoría íntegra, es admisible como prueba documental. La fuerza probatoria concreta depende de cada caso y jurisdicción — para asuntos de alto valor, te recomendamos verificar los requisitos específicos con tu propio criterio profesional.',
  },
  {
    slug: 'inmobiliarias',
    icon: Building2, color: '#0891b2',
    badgeEs: 'PARA INMOBILIARIAS',
    h1AccentEs: 'Firma Electrónica', h1RestEs: 'para Inmobiliarias y Agentes',
    titleEs: 'Firma Electrónica para Inmobiliarias | Arrendamientos y Ventas — CodecDocument',
    descEs: 'Firma electrónica para inmobiliarias: contratos de arrendamiento, promesas de compraventa y formularios firmados a distancia, sin que el cliente tenga que ir a la oficina.',
    painPointEs: 'Un cliente que quiere arrendar o comprar no siempre puede pasar por la oficina a firmar — y esperar a que lo haga puede significar perder el negocio frente a otra inmobiliaria más rápida.',
    useCasesEs: [
      'Contratos de arrendamiento residencial y comercial.',
      'Promesas de compraventa de inmuebles.',
      'Formularios de reserva y depósito de garantía.',
      'Autorizaciones de venta o arriendo firmadas por el propietario.',
    ],
    includedHeadingEs: 'Cierra el negocio sin esperar a que el cliente pase por la oficina',
    includedBodyEs: 'Envías el contrato, el cliente lo firma desde su celular en minutos, con su identidad verificada — y tú recibes el PDF certificado al instante, con tu logo y marca si personalizas tus documentos.',
    faqQEs: '¿El arrendatario puede firmar el contrato desde su celular sin instalar nada?',
    faqAEs: 'Sí. Le compartes un enlace de firma (por WhatsApp, correo, o el medio que prefieras), y desde ahí firma directamente en el navegador de su celular o computador — sin descargar ninguna aplicación.',
  },
  {
    slug: 'empresas',
    icon: Briefcase, color: '#2563eb',
    badgeEs: 'PARA EMPRESAS',
    h1AccentEs: 'Firma Electrónica', h1RestEs: 'para Empresas',
    titleEs: 'Firma Electrónica para Empresas | Contratos y Proveedores — CodecDocument',
    descEs: 'Firma electrónica para empresas de cualquier tamaño: contratos con proveedores, acuerdos comerciales y documentos internos, con tu propia marca en cada PDF.',
    painPointEs: 'Entre imprimir, firmar, escanear y reenviar, un contrato simple con un proveedor o socio comercial puede tardar días — solo por el papeleo, no por la negociación en sí.',
    useCasesEs: [
      'Contratos con proveedores y acuerdos comerciales.',
      'Acuerdos de confidencialidad (NDA) con socios y contrapartes.',
      'Contratos de servicio y órdenes de compra firmadas.',
      'Documentos internos que requieren firma de varios responsables.',
    ],
    includedHeadingEs: 'Tu marca en cada documento que envías',
    includedBodyEs: 'Sube tu logo, encabezado y pie de página una vez en Configuración — desde entonces, cada documento que generes o envíes a firmar sale con la identidad de tu empresa, de forma automática.',
    faqQEs: '¿Puedo tener varias plantillas propias de mi empresa listas para reutilizar?',
    faqAEs: 'Sí — con la función "Mis Plantillas" subes el documento que ya usas (Word o PDF), marcas con clics los campos que cambian cada vez, y desde entonces solo llenas un formulario corto cada vez que lo necesitas, con tu logo y marca puestos automáticamente.',
  },
  {
    slug: 'recursos-humanos',
    icon: Users, color: '#7c3aed',
    badgeEs: 'PARA RECURSOS HUMANOS',
    h1AccentEs: 'Firma Electrónica', h1RestEs: 'para Recursos Humanos',
    titleEs: 'Firma Electrónica para Recursos Humanos | Contratación a Distancia — CodecDocument',
    descEs: 'Firma electrónica para RRHH: cartas de oferta, contratos laborales y acuerdos de confidencialidad firmados a distancia, sin retrasar el ingreso de un nuevo colaborador.',
    painPointEs: 'Cuando un candidato acepta la oferta, cada día que se demora el papeleo es un día en que podría arrepentirse o recibir otra oferta — el proceso de firma no debería ser el cuello de botella.',
    useCasesEs: [
      'Cartas de oferta laboral y contratos de trabajo.',
      'Acuerdos de confidencialidad (NDA) para nuevos empleados.',
      'Políticas internas y códigos de conducta firmados.',
      'Acuerdos de terminación y finiquitos.',
    ],
    includedHeadingEs: 'De la oferta aceptada a la firma, el mismo día',
    includedBodyEs: 'Envías el contrato apenas el candidato confirma, y lo firma desde su celular con verificación de identidad incluida — sin coordinar una cita presencial solo para firmar papeles.',
    faqQEs: '¿Queda un registro de que el empleado realmente leyó y aceptó el documento?',
    faqAEs: 'Sí. Cada firma queda acompañada de verificación de identidad (selfie + documento), la dirección IP, fecha y hora exactas, todo dentro de la pista de auditoría del mismo PDF — un registro más completo que una firma en papel archivada en una carpeta.',
  },
  {
    slug: 'freelancers',
    icon: Laptop, color: '#059669',
    badgeEs: 'PARA FREELANCERS',
    h1AccentEs: 'Firma Electrónica', h1RestEs: 'para Freelancers',
    titleEs: 'Firma Electrónica para Freelancers | Contratos con Clientes — CodecDocument',
    descEs: 'Firma electrónica gratis para freelancers: contratos de servicio, acuerdos de confidencialidad y cotizaciones firmadas, sin depender de que el cliente imprima nada.',
    painPointEs: 'Como freelancer no siempre tienes un departamento legal detrás — necesitas que el contrato con un cliente nuevo quede firmado rápido, sin fricción, y sin que parezca improvisado.',
    useCasesEs: [
      'Contratos de prestación de servicios independientes.',
      'Acuerdos de confidencialidad (NDA) con clientes.',
      'Cotizaciones y propuestas firmadas antes de empezar un proyecto.',
      'Acuerdos de pago por hitos (milestones).',
    ],
    includedHeadingEs: 'Contratos profesionales, sin pagar por un plan empresarial',
    includedBodyEs: 'El plan gratuito te alcanza para tus primeros contratos — y cuando factures más, los planes premium tienen precios pensados para un profesional independiente, no para una empresa grande.',
    faqQEs: '¿De verdad puedo usarlo gratis o solo es una prueba de unos días?',
    faqAEs: 'El plan gratuito no tiene fecha de vencimiento — puedes generar un documento y una firma cada 72 horas de forma indefinida, sin tarjeta de crédito. Si necesitas más volumen, ahí sí tiene sentido pasar a un plan premium.',
  },
  {
    slug: 'constructores',
    icon: HardHat, color: '#d97706',
    badgeEs: 'PARA CONSTRUCTORES',
    h1AccentEs: 'Firma Electrónica', h1RestEs: 'para Constructores y Contratistas',
    titleEs: 'Firma Electrónica para Constructores | Contratos de Obra — CodecDocument',
    descEs: 'Firma electrónica para constructores y contratistas: contratos de obra, órdenes de cambio y acuerdos con subcontratistas, firmados desde el celular en la misma obra.',
    painPointEs: 'En obra no siempre hay una oficina cerca para firmar papeles — un cambio de alcance o una orden adicional necesita quedar firmada YA, no cuando alguien pase por la oficina.',
    useCasesEs: [
      'Contratos de obra y acuerdos con el cliente final.',
      'Órdenes de cambio (change orders) firmadas en el momento.',
      'Contratos con subcontratistas y proveedores de materiales.',
      'Actas de entrega y recepción de obra.',
    ],
    includedHeadingEs: 'Firma desde el celular, sin salir de la obra',
    includedBodyEs: 'Todo el flujo funciona desde el navegador del celular — el cliente o el subcontratista firma ahí mismo, sin necesidad de imprimir ni escanear nada.',
    faqQEs: '¿Necesito internet estable en la obra para que funcione?',
    faqAEs: 'Necesitas una conexión de datos móviles normal para cargar la página y firmar — no requiere una conexión especialmente rápida, funciona igual que cualquier página web desde el celular.',
  },
  {
    slug: 'contadores',
    icon: Calculator, color: '#dc2626',
    badgeEs: 'PARA CONTADORES',
    h1AccentEs: 'Firma Electrónica', h1RestEs: 'para Contadores y Firmas Contables',
    titleEs: 'Firma Electrónica para Contadores | Cartas de Compromiso — CodecDocument',
    descEs: 'Firma electrónica para contadores: cartas de compromiso, autorizaciones de representación y acuerdos de confidencialidad de información financiera, firmados a distancia.',
    painPointEs: 'Antes de empezar a trabajar con un cliente nuevo necesitas la carta de compromiso firmada — y perseguir esa firma no debería tomar más tiempo que el trabajo mismo.',
    useCasesEs: [
      'Cartas de compromiso (engagement letters) con clientes nuevos.',
      'Autorizaciones para representar al cliente ante entidades tributarias.',
      'Acuerdos de confidencialidad sobre información financiera sensible.',
      'Contratos de servicios contables recurrentes.',
    ],
    includedHeadingEs: 'La carta de compromiso firmada antes de la primera reunión',
    includedBodyEs: 'Envías el documento apenas el cliente confirma, y queda firmado con identidad verificada antes de que empieces a mover un solo número — dejando claro el alcance desde el primer día.',
    faqQEs: '¿Puedo reutilizar la misma carta de compromiso para cada cliente nuevo?',
    faqAEs: 'Sí — puedes crear una plantilla propia con los campos que cambian por cliente (nombre, alcance, honorarios) y generarla en minutos cada vez, en vez de editar un documento de Word desde cero cada vez.',
  },
  {
    slug: 'consultores',
    icon: Lightbulb, color: '#4f46e5',
    badgeEs: 'PARA CONSULTORES',
    h1AccentEs: 'Firma Electrónica', h1RestEs: 'para Consultores',
    titleEs: 'Firma Electrónica para Consultores | Propuestas y SOW — CodecDocument',
    descEs: 'Firma electrónica para consultores independientes y firmas de consultoría: propuestas, acuerdos de consultoría y statements of work (SOW) firmados sin fricción.',
    painPointEs: 'Una propuesta que se demora en firmarse pierde momentum — el cliente que estaba convencido en la reunión puede enfriarse si el contrato tarda días en llegar y firmarse.',
    useCasesEs: [
      'Propuestas y acuerdos de consultoría.',
      'Statements of Work (SOW) con alcance y entregables definidos.',
      'Acuerdos de confidencialidad (NDA) antes de compartir información estratégica.',
      'Contratos de retención mensual o por proyecto.',
    ],
    includedHeadingEs: 'De la propuesta aceptada al proyecto iniciado, sin demoras',
    includedBodyEs: 'Envías la propuesta con el enlace de firma incluido — el cliente la firma desde donde esté, y tú ya puedes empezar a trabajar con el contrato certificado en mano.',
    faqQEs: '¿Puedo personalizar la propuesta con mi logo y marca antes de enviarla?',
    faqAEs: 'Sí — configura tu logo, encabezado y pie de página una vez en Configuración, y cada propuesta o contrato que generes sale automáticamente con tu identidad de marca, con aspecto profesional desde el primer envío.',
  },
];
