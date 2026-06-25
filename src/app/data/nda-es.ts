// PLANTILLA DE ACUERDO DE CONFIDENCIALIDAD - TRADUCCIN AL ESPAOL
// Traduccin profesional del Acuerdo de Confidencialidad

import { DocumentTemplate } from '../types/document';

export const ndaTemplateES: DocumentTemplate = {
  id: 'nda',
  name: 'Acuerdo de Confidencialidad (NDA)',
  description: 'Acuerdo profesional de confidencialidad para proteger informacin empresarial sensible, secretos comerciales y datos propietarios. Adecuado para empleados, contratistas, socios y relaciones comerciales.',
  category: 'Negocios y Contratos',
  price: 9.99,
  fields: [
    // Tipo de Acuerdo
    { 
      id: 'agreement_type', 
      label: 'Tipo de Acuerdo de Confidencialidad', 
      type: 'select', 
      options: [
        'Unilateral (Una Va) - Solo una parte comparte informacin confidencial',
        'Mutuo (Dos Vas) - Ambas partes comparten informacin confidencial'
      ], 
      required: true,
      helpText: 'Unilateral: Solo t compartes info con ellos. Mutuo: Ambas partes comparten info entre s.'
    },
    
    // Disclosing Party Information
    { 
      id: 'disclosing_party_name', 
      label: 'Nombre Legal Completo de la Parte Divulgadora', 
      type: 'text', 
      required: true,
      helpText: 'La persona o empresa que COMPARTE informacin confidencial' 
    },
    { 
      id: 'disclosing_party_address', 
      label: 'Direccin de la Parte Divulgadora', 
      type: 'textarea', 
      required: true 
    },
    { 
      id: 'disclosing_party_email', 
      label: 'Correo electrnico de la Parte Divulgadora', 
      type: 'email', 
      required: false 
    },
    { 
      id: 'disclosing_party_type', 
      label: 'Tipo de Parte Divulgadora', 
      type: 'select', 
      options: ['Individual', 'Corporacin', 'LLC', 'Sociedad', 'Otra Entidad Empresarial'], 
      required: true 
    },
    
    // Receiving Party Information
    { 
      id: 'receiving_party_name', 
      label: 'Nombre Legal Completo de la Parte Receptora', 
      type: 'text', 
      required: true,
      helpText: 'La persona o empresa que RECIBE informacin confidencial'
    },
    { 
      id: 'receiving_party_address', 
      label: 'Direccin de la Parte Receptora', 
      type: 'textarea', 
      required: true 
    },
    { 
      id: 'receiving_party_email', 
      label: 'Correo electrnico de la Parte Receptora', 
      type: 'email', 
      required: false 
    },
    { 
      id: 'receiving_party_type', 
      label: 'Tipo de Parte Receptora', 
      type: 'select', 
      options: ['Individual', 'Corporacin', 'LLC', 'Sociedad', 'Otra Entidad Empresarial'], 
      required: true 
    },
    
    // Purpose of Disclosure
    { 
      id: 'disclosure_purpose', 
      label: 'Propsito de la Divulgacin', 
      type: 'textarea', 
      required: true,
      placeholder: 'Ejemplo: Evaluar una posible asociacin comercial, discutir una empresa conjunta, relacin laboral, servicios de contratista, etc.',
      helpText: 'Describe por qu se est compartiendo informacin confidencial'
    },
    
    // Plazo del Acuerdo
    { 
      id: 'term_type', 
      label: 'Plazo de Obligacin de Confidencialidad', 
      type: 'select', 
      options: [
        '1 Ao desde la Fecha Efectiva',
        '2 Aos desde la Fecha Efectiva',
        '3 Aos desde la Fecha Efectiva',
        '5 Aos desde la Fecha Efectiva',
        'Indefinido (Hasta que la informacin sea pblica)',
        'Duracin Personalizada'
      ], 
      required: true,
      helpText: 'Por cunto tiempo debe la parte receptora mantener la informacin confidencial?'
    },
    { 
      id: 'custom_term_years', 
      label: 'Duracin Personalizada (Aos) - Si seleccionaste "Duracin Personalizada"', 
      type: 'number', 
      required: false,
      placeholder: '3'
    },
    
    // Types of Confidential Information
    { 
      id: 'confidential_info_types', 
      label: 'Tipos de Informacin Confidencial (marca todos los que apliquen)', 
      type: 'textarea', 
      required: true,
      placeholder: 'Ejemplo: Secretos comerciales, planes de negocios, datos financieros, listas de clientes, software propietario, estrategias de marketing, especificaciones tcnicas, diseos de productos, etc.',
      helpText: 'S especfico sobre qu informacin se considera confidencial'
    },
    
    // Return of Materials
    { 
      id: 'return_materials', 
      label: 'Devolucin de Materiales al Terminar?', 
      type: 'select', 
      options: [
        'S - Todos los materiales deben ser devueltos o destruidos',
        'No - Los materiales pueden ser retenidos confidencialmente'
      ], 
      required: true 
    },
    
    // Non-Compete
    { 
      id: 'non_compete', 
      label: 'Incluir Clusula de No Competencia?', 
      type: 'select', 
      options: ['No', 'S'], 
      required: true,
      helpText: 'Restringe a la parte receptora de competir en el mismo negocio durante el plazo'
    },
    { 
      id: 'non_compete_duration', 
      label: 'Duracin de No Competencia (Meses) - Si es S', 
      type: 'number', 
      required: false,
      placeholder: '12'
    },
    { 
      id: 'non_compete_territory', 
      label: 'Territorio de No Competencia - Si es S', 
      type: 'text', 
      required: false,
      placeholder: 'Estados Unidos, California, radio de 50 millas, etc.'
    },
    
    // Non-Solicitation
    { 
      id: 'non_solicitation', 
      label: 'Incluir Clusula de No Solicitacin?', 
      type: 'select', 
      options: ['No', 'S'], 
      required: true,
      helpText: 'Previene que la parte receptora contrate empleados o solicite clientes'
    },
    { 
      id: 'non_solicitation_duration', 
      label: 'Duracin de No Solicitacin (Meses) - Si es S', 
      type: 'number', 
      required: false,
      placeholder: '12'
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
      helpText: 'Qu leyes estatales regirn este acuerdo?'
    },
    
    // Injunctive Relief
    { 
      id: 'injunctive_relief', 
      label: 'Clusula de Medida Cautelar?', 
      type: 'select', 
      options: [
        'S - El incumplimiento puede remediarse mediante medida cautelar sin fianza',
        'No'
      ], 
      required: true,
      helpText: 'Permite accin judicial inmediata para detener incumplimientos sin demora'
    },
    
    // Attorney Fees
    { 
      id: 'attorney_fees', 
      label: 'Honorarios de Abogado para la Parte Ganadora?', 
      type: 'select', 
      options: [
        'S - La parte ganadora en litigio recupera honorarios de abogado',
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
      placeholder: 'Cualquier trmino adicional o condicin especial para este NDA'
    },
  ],
  
  template: `ACUERDO DE CONFIDENCIALIDAD (NDA) MUTUO / UNILATERAL

Fecha de Entrada en Vigencia: {{current_day}} de {{current_month}} de {{current_year}}

Este Acuerdo de Confidencialidad ("Acuerdo") se celebra entre:

PARTE DIVULGADORA:
{{disclosing_party_name}}
{{disclosing_party_address}}
{{#if disclosing_party_email}}Correo electrnico: {{disclosing_party_email}}{{/if}}
Tipo: {{disclosing_party_type}}
("Parte Divulgadora")

y

PARTE RECEPTORA:
{{receiving_party_name}}
{{receiving_party_address}}
{{#if receiving_party_email}}Correo electrnico: {{receiving_party_email}}{{/if}}
Tipo: {{receiving_party_type}}
("Parte Receptora")

{{#if is_mutual}}
(Cada una podr denominarse una "Parte" y conjuntamente las "Partes". Este NDA se entiende como mutuo.)
{{else}}
(Cada una podr denominarse una "Parte" y conjuntamente las "Partes". Este NDA se entiende como unilateral.)
{{/if}}

1. OBJETO

Las Partes desean explorar y/o desarrollar el siguiente objeto comercial:
{{disclosure_purpose}} (el "Objeto").

2. DEFINICIN DE INFORMACIN CONFIDENCIAL

2.1. "Informacin Confidencial" significa toda informacin no pblica, propietaria, tcnica, financiera, comercial, operativa, legal o estratgica divulgada por la Parte Divulgadora a la Parte Receptora, en cualquier formato, incluyendo pero no limitndose a:

   {{confidential_info_types}}

2.2. La Informacin Confidencial incluye, sin limitacin:
   (a) Secretos comerciales, conocimientos tcnicos, invenciones, tcnicas, procesos y algoritmos;
   (b) Planes de negocios, estrategias, pronsticos e informacin financiera;
   (c) Listas de clientes y proveedores, informacin de contacto y detalles de relaciones;
   (d) Informacin de precios, datos de costos y mrgenes de ganancia;
   (e) Planes de marketing, estrategias de ventas e investigacin de mercado;
   (f) Software, cdigo fuente, cdigo objeto y especificaciones tcnicas;
   (g) Diseos de productos, prototipos y planes de desarrollo;
   (h) Informacin de personal y estructuras organizacionales;
   (i) Cualquier otra informacin marcada o identificada como "Confidencial", "Propietaria" o con una designacin similar;
   (j) Cualquier informacin que una persona razonable entendera como confidencial dada la naturaleza de la informacin y las circunstancias de divulgacin.

2.3. La Informacin Confidencial no incluir informacin que:
   (a) Es o se vuelve pblicamente disponible sin incumplimiento de este Acuerdo por parte de la Parte Receptora;
   (b) Estaba legtimamente en posesin de la Parte Receptora antes de la divulgacin por la Parte Divulgadora, segn lo evidenciado por registros escritos;
   (c) Es legtimamente recibida por la Parte Receptora de un tercero sin incumplimiento de ninguna obligacin de confidencialidad;
   (d) Es desarrollada independientemente por la Parte Receptora sin uso de o referencia a la Informacin Confidencial, segn lo evidenciado por registros escritos;
   (e) Es requerida ser divulgada por ley, regulacin u orden judicial, siempre que la Parte Receptora proporcione aviso escrito inmediato a la Parte Divulgadora y coopere en cualquier esfuerzo para buscar una orden de proteccin o de otra manera limitar tal divulgacin.

3. OBLIGACIONES DE LA PARTE RECEPTORA

3.1. La Parte Receptora acuerda:
   (a) Mantener toda la Informacin Confidencial en estricta confidencialidad;
   (b) Usar la Informacin Confidencial nicamente para el propsito establecido en este Acuerdo: {{disclosure_purpose}};
   (c) No divulgar, publicar o diseminar ninguna Informacin Confidencial a terceros sin el consentimiento previo por escrito de la Parte Divulgadora;
   (d) Proteger la Informacin Confidencial usando el mismo grado de cuidado que usa para proteger su propia informacin confidencial, pero en ningn caso menos que un cuidado razonable;
   (e) Limitar el acceso a empleados, directivos, abogados, contadores, consultores, contratistas, afiliados o asesores con necesidad legtima de conocer y sujetos a obligaciones de confidencialidad al menos equivalentes a este Acuerdo.

3.2. La Parte Receptora ser responsable por incumplimientos de sus empleados, contratistas, agentes o representantes.

3.3. La Parte Receptora no copiar, reproducir, realizar ingeniera inversa, descompilar, desensamblar ni explotar la Informacin Confidencial salvo autorizacin expresa por escrito.

4. DIVULGACIN LEGALMENTE REQUERIDA

Si la Parte Receptora est obligada por ley, regulacin, citacin u orden judicial a divulgar Informacin Confidencial, deber (en la medida legalmente permitida):
(a) notificar de inmediato a la Parte Divulgadora;
(b) cooperar para solicitar medidas de proteccin;
(c) divulgar nicamente la porcin mnima legalmente requerida.

5. PLAZO, PROPIEDAD Y DEVOLUCIN DE MATERIALES

5.1. Toda la Informacin Confidencial permanece como propiedad nica y exclusiva de la Parte Divulgadora. Este Acuerdo no otorga licencias, cesiones ni derechos de titularidad.

{{#if return_materials_yes}}
5.2. A solicitud escrita de la Parte Divulgadora, la Parte Receptora deber:
   (a) Devolver de inmediato a la Parte Divulgadora todos los documentos, materiales y otros elementos tangibles que contengan o representen Informacin Confidencial;
   (b) Eliminar o destruir permanentemente todas las copias electrnicas de Informacin Confidencial en su posesin o control;
   (c) Certificar por escrito a la Parte Divulgadora que ha cumplido con los requisitos de esta Seccin dentro de treinta (30) das de tal solicitud o terminacin.
{{/if}}

5.3. Este Acuerdo permanecer vigente por:

   {{term_description}}

5.4. Las obligaciones de confidencialidad sobrevivirn la terminacin o expiracin:
   (a) para secretos comerciales: por el mximo plazo permitido por ley aplicable;
   (b) para la dems Informacin Confidencial: por el plazo anterior o el exigido por la ley aplicable, lo que sea mayor.

6. PROPIEDAD INTELECTUAL

Nada de lo contenido en este Acuerdo transfiere derechos sobre patentes, marcas, derechos de autor, secretos comerciales, software, invenciones u otra propiedad intelectual.

{{#if non_compete_yes}}
7. NO COMPETENCIA (OPCIONAL)

Por {{non_compete_duration}} meses tras la terminacin, la Parte Receptora no competir directamente dentro de: {{non_compete_territory}}, en la medida en que sea exigible por ley aplicable.
{{/if}}

{{#if non_solicitation_yes}}
8. NO SOLICITACIN (OPCIONAL)

Por {{non_solicitation_duration}} meses tras la terminacin, la Parte Receptora no solicitar intencionalmente para contratacin personal de la Parte Divulgadora conocido a travs del Objeto, en la medida exigible por ley aplicable.
{{/if}}

9. EXCLUSIN DE GARANTAS

Toda Informacin Confidencial se entrega "TAL CUAL", sin garantas expresas ni implcitas, incluyendo exactitud, integridad, comerciabilidad, idoneidad para un propsito particular o no infraccin.

10. RECURSOS

10.1. La Parte Receptora reconoce y acepta que:
   (a) La Informacin Confidencial es valiosa y nica, y que la divulgacin en incumplimiento de este Acuerdo resultar en dao irreparable a la Parte Divulgadora;
   (b) Los daos monetarios seran un remedio inadecuado para cualquier incumplimiento de este Acuerdo;
   (c) La Parte Divulgadora tendr derecho a buscar alivio equitativo, incluyendo medida cautelar y desempeo especfico, en caso de cualquier incumplimiento o amenaza de incumplimiento de este Acuerdo;
   (d) Tales remedios sern adicionales a todos los dems remedios disponibles en derecho o equidad.

{{#if injunctive_relief_yes}}
10.2. La Parte Divulgadora podr solicitar medidas cautelares sin necesidad de fianza, en la medida permitida por la ley.
{{/if}}

11. LEY APLICABLE Y JURISDICCIN

11.1. Este Acuerdo se regir e interpretar de conformidad con las leyes del Estado de {{governing_state}}, sin consideracin a conflictos de leyes.

11.2. Cualquier disputa derivada de este Acuerdo ser resuelta exclusivamente ante tribunales estatales o federales competentes en {{governing_state}}.

12. DISPOSICIONES GENERALES

12.1. Acuerdo Integral. Este Acuerdo reemplaza cualquier negociacin o acuerdo previo sobre su objeto.

12.2. Modificaciones. Toda modificacin deber constar por escrito y estar firmada por ambas Partes.

12.3. Renuncia. Ninguna renuncia ser vlida salvo por escrito.

12.4. Divisibilidad. Si una disposicin es invlida o inaplicable, las dems continuarn en pleno vigor.

12.5. Cesin. Ninguna Parte podr ceder este Acuerdo sin consentimiento escrito de la otra, salvo en fusin, adquisicin o venta sustancial de activos.

12.6. Sin Asociacin. Este Acuerdo no crea sociedad, empresa conjunta, agencia, relacin laboral ni deber fiduciario.

12.7. Ejemplares y Firmas Electrnicas. Este Acuerdo podr firmarse en ejemplares y mediante firmas electrnicas, todos con plena validez.

12.8. Avisos. Todo aviso deber constar por escrito y enviarse a las direcciones de las Partes, salvo actualizacin escrita.

{{#if attorney_fees_yes}}
12.9. Honorarios Legales. La parte ganadora podr recuperar honorarios razonables de abogado y costos, en la medida permitida por ley.
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
4. Verificar que toda la informacin sea precisa y completa

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""`
};


