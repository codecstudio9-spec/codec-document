// CARTA DE RENUNCIA VOLUNTARIA
//
// Una sola plantilla para todos los países. El campo "país" no aparece
// escrito en el documento: sólo decide el vocabulario que un empleador
// local espera leer — cédula o DNI, liquidación o finiquito, certificación
// laboral o certificado de trabajo.
//
// Ver resignation-country-variations.ts. Los marcadores {{__algo}} los
// sustituye getCountrySpecificResignation() antes de rellenar los datos.

import { DocumentTemplate } from '../types/document';
import { LISTA_PAISES_RENUNCIA } from './resignation-country-variations';

export const resignationLetterTemplateES: DocumentTemplate = {
  id: 'resignation-letter',
  name: 'Carta de Renuncia',
  description: 'Carta de renuncia voluntaria lista para entregar, adaptada al país donde trabajas. Incluye el preaviso, la solicitud de liquidación y del certificado laboral, y espacio para firma. Se puede firmar digitalmente y enviar por correo sin imprimir nada.',
  category: 'Empleo y Recursos Humanos',
  price: 7.00,
  fields: [
    {
      id: 'country',
      label: 'País donde trabajas',
      type: 'select',
      required: true,
      options: LISTA_PAISES_RENUNCIA,
      helpText: 'Ajusta el documento a los términos que se usan en tu país. El país no aparece escrito en la carta.',
    },

    // ── Tus datos ──────────────────────────────────────────────────────
    {
      id: 'employee_name',
      label: 'Tu nombre completo',
      type: 'text',
      required: true,
      placeholder: 'Como aparece en tu documento de identidad',
    },
    {
      id: 'employee_id',
      label: 'Número de tu documento de identidad',
      type: 'text',
      required: true,
      helpText: 'Cédula, DNI, RUT o el que corresponda en tu país',
    },
    {
      id: 'employee_position',
      label: 'Cargo que ocupas',
      type: 'text',
      required: true,
      placeholder: 'Auxiliar contable, Asesor comercial…',
    },
    {
      id: 'employee_phone',
      label: 'Tu teléfono',
      type: 'tel',
      required: true,
      helpText: 'Para que puedan contactarte por la liquidación o el certificado',
    },
    {
      id: 'employee_email',
      label: 'Tu correo electrónico',
      type: 'email',
      required: false,
    },

    // ── La empresa ─────────────────────────────────────────────────────
    {
      id: 'company_name',
      label: 'Nombre de la empresa',
      type: 'text',
      required: true,
      placeholder: 'Razón social completa',
    },
    {
      id: 'recipient_name',
      label: '¿A quién va dirigida?',
      type: 'text',
      required: false,
      placeholder: 'Nombre de tu jefe o del área de Talento Humano',
      helpText: 'Si lo dejas vacío, la carta va dirigida a la empresa',
    },
    {
      id: 'recipient_title',
      label: 'Cargo de quien la recibe',
      type: 'text',
      required: false,
      placeholder: 'Gerente de Talento Humano',
    },

    // ── Fechas ─────────────────────────────────────────────────────────
    {
      id: 'start_date',
      label: 'Fecha en que entraste a trabajar',
      type: 'date',
      required: true,
    },
    {
      id: 'last_day',
      label: 'Tu último día de trabajo',
      type: 'date',
      required: true,
      // El aviso legal vive aquí, junto a la decisión que condiciona, y ya no
      // impreso al final de la carta: una nota dirigida a quien firma no
      // pinta nada dentro del documento que va a entregar.
      helpText: 'Cuenta el preaviso desde hoy; el plazo que te obliga es el de tu contrato o convenio. Ojo: una renuncia voluntaria normalmente no da derecho a indemnización por despido — si te vas por incumplimientos de la empresa, consulta con un abogado laboral antes de firmar, porque hay figuras distintas a la renuncia simple.',
    },

    // ── Contenido ──────────────────────────────────────────────────────
    {
      id: 'letter_city',
      label: 'Ciudad donde firmas',
      type: 'text',
      required: true,
      placeholder: 'Bogotá',
    },
    {
      id: 'reason',
      label: 'Tu mensaje personal',
      type: 'textarea',
      required: false,
      placeholder: 'Cuenta con tus palabras por qué te vas y qué te llevas de la empresa. Puedes dictarlo con el micrófono.',
      helpText: 'Va dentro de la carta, con tu voz. Dícta lo que quieras decir y pulsa «Mejorar con IA»: corrige la redacción y le da tono de carta formal sin cambiar lo que dijiste. Es opcional, y no estás obligado a explicar por qué te vas.',
    },
    {
      id: 'include_handover',
      label: 'Ofrecer entrega formal del cargo',
      type: 'checkbox',
      required: false,
      helpText: 'Te compromete a dejar los pendientes en orden. Deja buena impresión.',
    },
    {
      id: 'include_receipt',
      label: 'Añadir constancia de recibido al final',
      type: 'checkbox',
      required: false,
      helpText: 'Un recuadro con espacio para que quien reciba la carta te la firme. Sirve si la entregas impresa y quieres prueba del día en que renunciaste. Si la firmas tú digitalmente y la envías, no hace falta.',
    },
  ],

  // Cada bloque va separado por una línea en blanco, y eso es deliberado: en
  // una carta el destinatario, el asunto y cada párrafo se leen como unidades
  // sueltas, no como un muro de texto. El maquetador convierte esa línea en
  // blanco en separación real (ver `separacion` en document-preview.tsx).
  //
  // Las condicionales van pegadas al final de la línea anterior: solas, al no
  // cumplirse, dejarían un hueco doble donde debería haber uno.
  template: `{{letter_city}}, {{current_date}}

Señores

{{company_name}}{{#if recipient_name}}

{{recipient_name}}{{/if}}{{#if recipient_title}}

{{recipient_title}}{{/if}}

Ciudad

ASUNTO: Renuncia voluntaria al cargo de {{employee_position}}

Yo, {{employee_name}}, mayor de edad, identificado(a) con {{__documento}} número {{employee_id}}, por medio de la presente me permito comunicar de manera libre, voluntaria e irrevocable mi decisión de renunciar al cargo de {{employee_position}}, que vengo desempeñando en {{company_name}} desde el {{start_date}}{{#if tiempo_servicio}}, completando a la fecha {{tiempo_servicio}} de servicio{{/if}}.

Mi último día laborado fue el {{last_day}}, fecha a partir de la cual quedó terminada la relación laboral que nos vincula.

{{#if reason}}{{reason}}

{{/if}}{{#if include_handover}}Durante el tiempo que resta me comprometo a entregar de manera ordenada y documentada los asuntos a mi cargo, así como a acompañar el empalme con la persona que la empresa designe, con el fin de que mi retiro no afecte la continuidad de las labores.

{{/if}}Solicito respetuosamente que se proceda con la {{__liquidacion}} y demás conceptos laborales a los que haya lugar, y que se me expida la {{__certificado}} correspondiente.

Quedo atento(a) a cualquier comunicación en los datos de contacto que registro al pie.

Cordialmente,

{{employee_name}}

{{__documento_corto}} {{employee_id}}

Teléfono: {{employee_phone}}{{#if employee_email}}

Correo: {{employee_email}}{{/if}}

Firma: _______________________________{{#if include_receipt}}

---------------------------------------------------------------------------

CONSTANCIA DE RECIBIDO

Recibido por: _______________________________________

Cargo: ______________________________________________

Fecha: ______________________________________________

Firma: ______________________________________________{{/if}}`,
};
