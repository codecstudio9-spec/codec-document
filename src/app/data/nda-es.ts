// PLANTILLA DE ACUERDO DE CONFIDENCIALIDAD - TRADUCCIÓN AL ESPAÑOL
// Traducción profesional del Acuerdo de Confidencialidad

import { DocumentTemplate } from '../types/document';

export const ndaTemplateES: DocumentTemplate = {
  id: 'nda',
  name: 'Acuerdo de Confidencialidad (NDA)',
  description: 'Acuerdo profesional de confidencialidad para proteger información empresarial sensible, secretos comerciales y datos propietarios. Adecuado para empleados, contratistas, socios y relaciones comerciales.',
  category: 'Negocios y Contratos',
  price: 9.99,
  fields: [
    // Tipo de Acuerdo
    {
      id: 'agreement_type',
      label: 'Tipo de Acuerdo de Confidencialidad',
      type: 'select',
      options: [
        'Unilateral (Una Vía) - Solo una parte comparte información confidencial',
        'Mutuo (Dos Vías) - Ambas partes comparten información confidencial'
      ],
      required: true,
      helpText: 'Unilateral: Solo tú compartes info con ellos. Mutuo: Ambas partes comparten info entre sí.'
    },

    // Disclosing Party Information
    {
      id: 'disclosing_party_name',
      label: 'Nombre Legal Completo de la Parte Divulgadora',
      type: 'text',
      required: true,
      helpText: 'La persona o empresa que COMPARTE información confidencial'
    },
    {
      id: 'disclosing_party_address',
      label: 'Dirección de la Parte Divulgadora',
      type: 'textarea',
      required: true
    },
    {
      id: 'disclosing_party_email',
      label: 'Correo electrónico de la Parte Divulgadora',
      type: 'email',
      required: false
    },
    {
      id: 'disclosing_party_type',
      label: 'Tipo de Parte Divulgadora',
      type: 'select',
      options: ['Individual', 'Corporación', 'LLC', 'Sociedad', 'Otra Entidad Empresarial'],
      required: true
    },

    // Receiving Party Information
    {
      id: 'receiving_party_name',
      label: 'Nombre Legal Completo de la Parte Receptora',
      type: 'text',
      required: true,
      helpText: 'La persona o empresa que RECIBE información confidencial'
    },
    {
      id: 'receiving_party_address',
      label: 'Dirección de la Parte Receptora',
      type: 'textarea',
      required: true
    },
    {
      id: 'receiving_party_email',
      label: 'Correo electrónico de la Parte Receptora',
      type: 'email',
      required: false
    },
    {
      id: 'receiving_party_type',
      label: 'Tipo de Parte Receptora',
      type: 'select',
      options: ['Individual', 'Corporación', 'LLC', 'Sociedad', 'Otra Entidad Empresarial'],
      required: true
    },

    // Purpose of Disclosure
    {
      id: 'disclosure_purpose',
      label: 'Propósito de la Divulgación',
      type: 'textarea',
      required: true,
      placeholder: 'Ejemplo: Evaluar una posible asociación comercial, discutir una empresa conjunta, relación laboral, servicios de contratista, etc.',
      helpText: 'Describe por qué se está compartiendo información confidencial'
    },

    // Plazo del Acuerdo
    {
      id: 'term_type',
      label: 'Plazo de Obligación de Confidencialidad',
      type: 'select',
      options: [
        '1 Año desde la Fecha Efectiva',
        '2 Años desde la Fecha Efectiva',
        '3 Años desde la Fecha Efectiva',
        '5 Años desde la Fecha Efectiva',
        'Indefinido (Hasta que la información sea pública)',
        'Duración Personalizada'
      ],
      required: true,
      helpText: '¿Por cuánto tiempo debe la parte receptora mantener la información confidencial?'
    },
    {
      id: 'custom_term_years',
      label: 'Duración Personalizada (Años) - Si seleccionaste "Duración Personalizada"',
      type: 'number',
      required: false,
      placeholder: 'Ej: 3'
    },

    // Types of Confidential Information
    {
      id: 'confidential_info_types',
      label: 'Tipos de Información Confidencial (marca todos los que apliquen)',
      type: 'textarea',
      required: true,
      placeholder: 'Ejemplo: Secretos comerciales, planes de negocios, datos financieros, listas de clientes, software propietario, estrategias de marketing, especificaciones técnicas, diseños de productos, etc.',
      helpText: 'Sé específico sobre qué información se considera confidencial'
    },

    // Return of Materials
    {
      id: 'return_materials',
      label: '¿Devolución de Materiales al Terminar?',
      type: 'select',
      options: [
        'Sí - Todos los materiales deben ser devueltos o destruidos',
        'No - Los materiales pueden ser retenidos confidencialmente'
      ],
      required: true
    },

    // Non-Compete
    {
      id: 'non_compete',
      label: '¿Incluir Cláusula de No Competencia?',
      type: 'select',
      options: ['No', 'Sí'],
      required: true,
      helpText: 'Restringe a la parte receptora de competir en el mismo negocio durante el plazo'
    },
    {
      id: 'non_compete_duration',
      label: 'Duración de No Competencia (Meses) - Si es Sí',
      type: 'number',
      required: false,
      placeholder: 'Ej: 12'
    },
    {
      id: 'non_compete_territory',
      label: 'Territorio de No Competencia - Si es Sí',
      type: 'text',
      required: false,
      placeholder: 'Estados Unidos, California, radio de 50 millas, etc.'
    },

    // Non-Solicitation
    {
      id: 'non_solicitation',
      label: '¿Incluir Cláusula de No Solicitación?',
      type: 'select',
      options: ['No', 'Sí'],
      required: true,
      helpText: 'Previene que la parte receptora contrate empleados o solicite clientes'
    },
    {
      id: 'non_solicitation_duration',
      label: 'Duración de No Solicitación (Meses) - Si es Sí',
      type: 'number',
      required: false,
      placeholder: 'Ej: 12'
    },

    // Governing Law
    {
      id: 'governing_state',
      label: 'Ley Estatal Aplicable',
      type: 'select',
      options: [
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
        'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
        'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
        'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
        'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
        'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
        'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
        'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
        'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
        'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
      ],
      required: true,
      helpText: '¿Qué leyes estatales regirán este acuerdo?'
    },

    // Injunctive Relief
    {
      id: 'injunctive_relief',
      label: '¿Cláusula de Medida Cautelar?',
      type: 'select',
      options: [
        'Sí - El incumplimiento puede remediarse mediante medida cautelar sin fianza',
        'No'
      ],
      required: true,
      helpText: 'Permite acción judicial inmediata para detener incumplimientos sin demora'
    },

    // Attorney Fees
    {
      id: 'attorney_fees',
      label: '¿Honorarios de Abogado para la Parte Ganadora?',
      type: 'select',
      options: [
        'Sí - La parte ganadora en litigio recupera honorarios de abogado',
        'No - Cada parte paga sus propios honorarios de abogado'
      ],
      required: true
    },

    // Additional Provisions
    {
      id: 'additional_provisions',
      label: 'Provisiones Adicionales (Opcional)',
      type: 'textarea',
      required: false,
      placeholder: 'Cualquier término adicional o condición especial para este NDA'
    },
  ],

  template: `ACUERDO DE CONFIDENCIALIDAD (NDA) MUTUO / UNILATERAL

Fecha de Entrada en Vigencia: {{current_day}} de {{current_month}} de {{current_year}}

Este Acuerdo de Confidencialidad ("Acuerdo") se celebra entre:

PARTE DIVULGADORA:
{{disclosing_party_name}}
{{disclosing_party_address}}
{{#if disclosing_party_email}}Correo electrónico: {{disclosing_party_email}}{{/if}}
Tipo: {{disclosing_party_type}}
("Parte Divulgadora")

y

PARTE RECEPTORA:
{{receiving_party_name}}
{{receiving_party_address}}
{{#if receiving_party_email}}Correo electrónico: {{receiving_party_email}}{{/if}}
Tipo: {{receiving_party_type}}
("Parte Receptora")

{{#if is_mutual}}
(Cada una podrá denominarse una "Parte" y conjuntamente las "Partes". Este NDA se entiende como mutuo.)
{{else}}
(Cada una podrá denominarse una "Parte" y conjuntamente las "Partes". Este NDA se entiende como unilateral.)
{{/if}}

1. OBJETO

Las Partes desean explorar y/o desarrollar el siguiente objeto comercial:
{{disclosure_purpose}} (el "Objeto").

2. DEFINICIÓN DE INFORMACIÓN CONFIDENCIAL

2.1. "Información Confidencial" significa toda información no pública, propietaria, técnica, financiera, comercial, operativa, legal o estratégica divulgada por la Parte Divulgadora a la Parte Receptora, en cualquier formato, incluyendo pero no limitándose a:

   {{confidential_info_types}}

2.2. La Información Confidencial incluye, sin limitación:
   (a) Secretos comerciales, conocimientos técnicos, invenciones, técnicas, procesos y algoritmos;
   (b) Planes de negocios, estrategias, pronósticos e información financiera;
   (c) Listas de clientes y proveedores, información de contacto y detalles de relaciones;
   (d) Información de precios, datos de costos y márgenes de ganancia;
   (e) Planes de marketing, estrategias de ventas e investigación de mercado;
   (f) Software, código fuente, código objeto y especificaciones técnicas;
   (g) Diseños de productos, prototipos y planes de desarrollo;
   (h) Información de personal y estructuras organizacionales;
   (i) Cualquier otra información marcada o identificada como "Confidencial", "Propietaria" o con una designación similar;
   (j) Cualquier información que una persona razonable entendería como confidencial dada la naturaleza de la información y las circunstancias de divulgación.

2.3. La Información Confidencial no incluirá información que:
   (a) Es o se vuelve públicamente disponible sin incumplimiento de este Acuerdo por parte de la Parte Receptora;
   (b) Estaba legítimamente en posesión de la Parte Receptora antes de la divulgación por la Parte Divulgadora, según lo evidenciado por registros escritos;
   (c) Es legítimamente recibida por la Parte Receptora de un tercero sin incumplimiento de ninguna obligación de confidencialidad;
   (d) Es desarrollada independientemente por la Parte Receptora sin uso de o referencia a la Información Confidencial, según lo evidenciado por registros escritos;
   (e) Es requerida ser divulgada por ley, regulación u orden judicial, siempre que la Parte Receptora proporcione aviso escrito inmediato a la Parte Divulgadora y coopere en cualquier esfuerzo para buscar una orden de protección o de otra manera limitar tal divulgación.

3. OBLIGACIONES DE LA PARTE RECEPTORA

3.1. La Parte Receptora acuerda:
   (a) Mantener toda la Información Confidencial en estricta confidencialidad;
   (b) Usar la Información Confidencial únicamente para el propósito establecido en este Acuerdo: {{disclosure_purpose}};
   (c) No divulgar, publicar o diseminar ninguna Información Confidencial a terceros sin el consentimiento previo por escrito de la Parte Divulgadora;
   (d) Proteger la Información Confidencial usando el mismo grado de cuidado que usa para proteger su propia información confidencial, pero en ningún caso menos que un cuidado razonable;
   (e) Limitar el acceso a empleados, directivos, abogados, contadores, consultores, contratistas, afiliados o asesores con necesidad legítima de conocer y sujetos a obligaciones de confidencialidad al menos equivalentes a este Acuerdo.

3.2. La Parte Receptora será responsable por incumplimientos de sus empleados, contratistas, agentes o representantes.

3.3. La Parte Receptora no copiará, reproducirá, realizará ingeniería inversa, descompilará, desensamblará ni explotará la Información Confidencial salvo autorización expresa por escrito.

4. DIVULGACIÓN LEGALMENTE REQUERIDA

Si la Parte Receptora está obligada por ley, regulación, citación u orden judicial a divulgar Información Confidencial, deberá (en la medida legalmente permitida):
(a) notificar de inmediato a la Parte Divulgadora;
(b) cooperar para solicitar medidas de protección;
(c) divulgar únicamente la porción mínima legalmente requerida.

5. PLAZO, PROPIEDAD Y DEVOLUCIÓN DE MATERIALES

5.1. Toda la Información Confidencial permanece como propiedad única y exclusiva de la Parte Divulgadora. Este Acuerdo no otorga licencias, cesiones ni derechos de titularidad.

{{#if return_materials_yes}}
5.2. A solicitud escrita de la Parte Divulgadora, la Parte Receptora deberá:
   (a) Devolver de inmediato a la Parte Divulgadora todos los documentos, materiales y otros elementos tangibles que contengan o representen Información Confidencial;
   (b) Eliminar o destruir permanentemente todas las copias electrónicas de Información Confidencial en su posesión o control;
   (c) Certificar por escrito a la Parte Divulgadora que ha cumplido con los requisitos de esta Sección dentro de treinta (30) días de tal solicitud o terminación.
{{/if}}

5.3. Este Acuerdo permanecerá vigente por:

   {{term_description}}

5.4. Las obligaciones de confidencialidad sobrevivirán la terminación o expiración:
   (a) para secretos comerciales: por el máximo plazo permitido por ley aplicable;
   (b) para la demás Información Confidencial: por el plazo anterior o el exigido por la ley aplicable, lo que sea mayor.

6. PROPIEDAD INTELECTUAL

Nada de lo contenido en este Acuerdo transfiere derechos sobre patentes, marcas, derechos de autor, secretos comerciales, software, invenciones u otra propiedad intelectual.

{{#if non_compete_yes}}
7. NO COMPETENCIA (OPCIONAL)

Por {{non_compete_duration}} meses tras la terminación, la Parte Receptora no competirá directamente dentro de: {{non_compete_territory}}, en la medida en que sea exigible por ley aplicable.
{{/if}}

{{#if non_solicitation_yes}}
8. NO SOLICITACIÓN (OPCIONAL)

Por {{non_solicitation_duration}} meses tras la terminación, la Parte Receptora no solicitará intencionalmente para contratación personal de la Parte Divulgadora conocido a través del Objeto, en la medida exigible por ley aplicable.
{{/if}}

9. EXCLUSIÓN DE GARANTÍAS

Toda Información Confidencial se entrega "TAL CUAL", sin garantías expresas ni implícitas, incluyendo exactitud, integridad, comerciabilidad, idoneidad para un propósito particular o no infracción.

10. RECURSOS

10.1. La Parte Receptora reconoce y acepta que:
   (a) La Información Confidencial es valiosa y única, y que la divulgación en incumplimiento de este Acuerdo resultará en daño irreparable a la Parte Divulgadora;
   (b) Los daños monetarios serían un remedio inadecuado para cualquier incumplimiento de este Acuerdo;
   (c) La Parte Divulgadora tendrá derecho a buscar alivio equitativo, incluyendo medida cautelar y desempeño específico, en caso de cualquier incumplimiento o amenaza de incumplimiento de este Acuerdo;
   (d) Tales remedios serán adicionales a todos los demás remedios disponibles en derecho o equidad.

{{#if injunctive_relief_yes}}
10.2. La Parte Divulgadora podrá solicitar medidas cautelares sin necesidad de fianza, en la medida permitida por la ley.
{{/if}}

11. LEY APLICABLE Y JURISDICCIÓN

11.1. Este Acuerdo se regirá e interpretará de conformidad con las leyes del Estado de {{governing_state}}, sin consideración a conflictos de leyes.

11.2. Cualquier disputa derivada de este Acuerdo será resuelta exclusivamente ante tribunales estatales o federales competentes en {{governing_state}}.

12. DISPOSICIONES GENERALES

12.1. Acuerdo Integral. Este Acuerdo reemplaza cualquier negociación o acuerdo previo sobre su objeto.

12.2. Modificaciones. Toda modificación deberá constar por escrito y estar firmada por ambas Partes.

12.3. Renuncia. Ninguna renuncia será válida salvo por escrito.

12.4. Divisibilidad. Si una disposición es inválida o inaplicable, las demás continuarán en pleno vigor.

12.5. Cesión. Ninguna Parte podrá ceder este Acuerdo sin consentimiento escrito de la otra, salvo en fusión, adquisición o venta sustancial de activos.

12.6. Sin Asociación. Este Acuerdo no crea sociedad, empresa conjunta, agencia, relación laboral ni deber fiduciario.

12.7. Ejemplares y Firmas Electrónicas. Este Acuerdo podrá firmarse en ejemplares y mediante firmas electrónicas, todos con plena validez.

12.8. Avisos. Todo aviso deberá constar por escrito y enviarse a las direcciones de las Partes, salvo actualización escrita.

{{#if attorney_fees_yes}}
12.9. Honorarios Legales. La parte ganadora podrá recuperar honorarios razonables de abogado y costos, en la medida permitida por ley.
{{/if}}

{{#if additional_provisions}}
13. DISPOSICIONES ADICIONALES

{{additional_provisions}}
{{/if}}

EN TESTIMONIO DE LO CUAL, las Partes firman este Acuerdo en la Fecha de Vigencia indicada.

PARTE DIVULGADORA

_________________________________
{{disclosing_party_name}}

Firma: _______________________________

Nombre / Cargo: _______________________

Fecha: ________________________________


PARTE RECEPTORA

_________________________________
{{receiving_party_name}}

Firma: _______________________________

Nombre / Cargo: _______________________

Fecha: ________________________________


AVISO LEGAL IMPORTANTE:

Este Acuerdo de Confidencialidad es un contrato legalmente vinculante. Antes de firmar:
1. Leer todas las disposiciones cuidadosamente
2. Consultar con un abogado con licencia en tu estado
3. Asegurarte de entender tus obligaciones y restricciones
4. Verificar que toda la información sea precisa y completa

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""`
};
