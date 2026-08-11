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
      helpText: 'Cuenta el preaviso desde hoy. Lo habitual en tu país son {{__preaviso_habitual}}, pero revisa tu contrato.',
    },
    {
      id: 'time_worked',
      label: 'Tiempo que llevas en la empresa',
      type: 'text',
      required: false,
      placeholder: '2 años y 4 meses',
      helpText: 'Opcional. Si lo dejas vacío, la carta solo menciona las fechas.',
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
      label: 'Motivo de la renuncia',
      type: 'textarea',
      required: false,
      placeholder: 'Por motivos personales / Para asumir un nuevo proyecto profesional',
      helpText: 'Opcional, y breve. No estás obligado a dar explicaciones.',
    },
    {
      id: 'include_thanks',
      label: 'Incluir párrafo de agradecimiento',
      type: 'checkbox',
      required: false,
      helpText: 'Recomendado: mantiene la puerta abierta para una referencia futura',
    },
    {
      id: 'include_handover',
      label: 'Ofrecer entrega formal del cargo',
      type: 'checkbox',
      required: false,
      helpText: 'Te compromete a dejar los pendientes en orden. Deja buena impresión.',
    },
  ],

  template: `{{letter_city}}, {{current_date}}


Señores
{{company_name}}
{{#if recipient_name}}Atención: {{recipient_name}}{{#if recipient_title}} — {{recipient_title}}{{/if}}{{/if}}
Ciudad


ASUNTO: Renuncia voluntaria al cargo de {{employee_position}}


Respetados señores:

Yo, {{employee_name}}, mayor de edad, identificado(a) con {{__documento}} número {{employee_id}}, por medio de la presente me permito comunicar de manera libre, voluntaria e irrevocable mi decisión de renunciar al cargo de {{employee_position}}, que vengo desempeñando en {{company_name}} desde el {{start_date}}{{#if time_worked}}, completando a la fecha {{time_worked}} de servicio{{/if}}.

Mi último día de labores será el {{last_day}}, fecha a partir de la cual quedará terminada la relación laboral que nos vincula.

{{#if reason}}{{reason}}

{{/if}}{{#if include_handover}}Durante el tiempo que resta me comprometo a entregar de manera ordenada y documentada los asuntos a mi cargo, así como a acompañar el empalme con la persona que la empresa designe, con el fin de que mi retiro no afecte la continuidad de las labores.

{{/if}}{{#if include_thanks}}Aprovecho para expresar mi agradecimiento a {{company_name}} por la oportunidad y por la experiencia adquirida durante este tiempo. Me llevo aprendizajes valiosos y el mejor recuerdo del equipo de trabajo.

{{/if}}Solicito respetuosamente que se proceda con la {{__liquidacion}} y demás conceptos laborales a que haya lugar, y que se me expida la {{__certificado}} correspondiente una vez terminada la relación.

Quedo atento(a) a cualquier comunicación en los datos de contacto que registro al pie.


Cordialmente,




_______________________________________
{{employee_name}}
{{__documento_corto}} {{employee_id}}
{{employee_phone}}
{{#if employee_email}}{{employee_email}}{{/if}}


"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

CONSTANCIA DE RECIBIDO

Recibido por: _______________________________________

Cargo: ______________________________________________

Fecha: ______________________________________________

Firma: ______________________________________________

"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""

NOTA PARA QUIEN FIRMA — no forma parte de la carta

· Entrega la carta con copia y pide que te firmen la constancia de
  recibido. Es tu prueba de que renunciaste y de qué día lo hiciste.
· El preaviso habitual donde trabajas es de {{__preaviso_habitual}}, pero
  el plazo que te obliga es el de tu contrato o el de tu convenio
  colectivo. Revísalo antes de fijar tu último día.
· Una renuncia voluntaria normalmente no da derecho a indemnización por
  despido. Si tu salida se debe a incumplimientos de la empresa, consulta
  con un abogado laboral antes de firmar: existen figuras distintas a la
  renuncia simple.
· Este documento es un modelo general. No sustituye la asesoría de un
  profesional del derecho laboral de tu país.`,
};
