// RESIGNATION LETTER
//
// One template for every country. The "country" field never appears in the
// document itself — it only decides the wording a local employer expects to
// read. See resignation-country-variations.ts.

import { DocumentTemplate } from '../types/document';
import { LISTA_PAISES_RENUNCIA } from './resignation-country-variations';

export const resignationLetterTemplate: DocumentTemplate = {
  id: 'resignation-letter',
  name: 'Resignation Letter',
  description: 'A professional resignation letter, ready to hand in and adapted to the country where you work. Includes notice period, request for final settlement and employment certificate, and a signature block. Can be signed digitally and emailed without printing anything.',
  category: 'Employment & HR',
  price: 7.00,
  fields: [
    {
      id: 'country',
      label: 'Country where you work',
      type: 'select',
      required: true,
      options: LISTA_PAISES_RENUNCIA,
      helpText: 'Adapts the wording to your country. The country name never appears in the letter.',
    },

    {
      id: 'employee_name',
      label: 'Your full name',
      type: 'text',
      required: true,
      placeholder: 'As it appears on your ID',
    },
    {
      id: 'employee_id',
      label: 'Your ID number',
      type: 'text',
      required: true,
    },
    {
      id: 'employee_position',
      label: 'Your job title',
      type: 'text',
      required: true,
    },
    {
      id: 'employee_phone',
      label: 'Your phone number',
      type: 'tel',
      required: true,
      helpText: 'So they can reach you about your final pay or certificate',
    },
    {
      id: 'employee_email',
      label: 'Your email',
      type: 'email',
      required: false,
    },

    {
      id: 'company_name',
      label: 'Company name',
      type: 'text',
      required: true,
    },
    {
      id: 'recipient_name',
      label: 'Who is it addressed to?',
      type: 'text',
      required: false,
      placeholder: 'Your manager or HR',
      helpText: 'Leave empty to address the company itself',
    },
    {
      id: 'recipient_title',
      label: 'Their job title',
      type: 'text',
      required: false,
    },

    {
      id: 'start_date',
      label: 'Date you started working',
      type: 'date',
      required: true,
    },
    {
      id: 'last_day',
      label: 'Your last working day',
      type: 'date',
      required: true,
      helpText: 'Count the notice period from today. Check your contract for the exact term.',
    },
    {
      id: 'time_worked',
      label: 'How long you have been there',
      type: 'text',
      required: false,
      placeholder: '2 years and 4 months',
    },

    {
      id: 'letter_city',
      label: 'City where you sign',
      type: 'text',
      required: true,
    },
    {
      id: 'reason',
      label: 'Your personal message',
      type: 'textarea',
      required: false,
      placeholder: 'Say in your own words why you are leaving and what you take away from the company. You can dictate it with the microphone.',
      helpText: 'It goes inside the letter, in your own voice. Dictate whatever you want to say and press "Improve with AI": it fixes the writing and gives it the register of a formal letter without changing what you said. Optional — you are not required to explain why you are leaving.',
    },
    {
      id: 'include_thanks',
      label: 'Add a standard thank-you paragraph',
      type: 'checkbox',
      required: false,
      helpText: 'If you already wrote your own message above, leave this off: it would say the same thing twice.',
    },
    {
      id: 'include_handover',
      label: 'Offer a formal handover',
      type: 'checkbox',
      required: false,
    },
  ],

  template: `{{letter_city}}, {{current_date}}


{{company_name}}
{{#if recipient_name}}Attention: {{recipient_name}}{{#if recipient_title}} — {{recipient_title}}{{/if}}{{/if}}


SUBJECT: Voluntary resignation from the position of {{employee_position}}


Dear Sir or Madam,

I, {{employee_name}}, holder of {{__documento}} number {{employee_id}}, hereby give formal notice of my voluntary and irrevocable decision to resign from the position of {{employee_position}}, which I have held at {{company_name}} since {{start_date}}{{#if time_worked}}, completing {{time_worked}} of service{{/if}}.

My last working day will be {{last_day}}, after which our employment relationship will come to an end.

{{#if reason}}{{reason}}

{{/if}}{{#if include_handover}}During the remaining time I commit to handing over my responsibilities in an orderly and documented manner, and to supporting the transition with whoever the company appoints, so that my departure does not disrupt ongoing work.

{{/if}}{{#if include_thanks}}I would like to thank {{company_name}} for the opportunity and for everything I have learned during this time. I leave with valuable experience and the best memories of the team.

{{/if}}I respectfully request that my {{__liquidacion}} and any other amounts owed be processed, and that the corresponding {{__certificado}} be issued once the relationship ends.

I remain available at the contact details below.


Sincerely,




_______________________________________
{{employee_name}}
{{__documento_corto}} {{employee_id}}
{{employee_phone}}{{#if employee_email}}
{{employee_email}}{{/if}}


---------------------------------------------------------------------------

ACKNOWLEDGEMENT OF RECEIPT

Received by: ________________________________________
Title: ______________________________________________
Date: _______________________________________________
Signature: __________________________________________

---------------------------------------------------------------------------

NOTE FOR THE SIGNER — not part of the letter

· Hand in the letter with a copy and ask them to sign the acknowledgement.
  That is your proof that you resigned and on what date.
· The customary notice period where you work is {{__preaviso_habitual}},
  but the term that binds you is the one in your contract or collective
  agreement. Check it before setting your last day.
· Voluntary resignation usually does not entitle you to severance. If you
  are leaving because of the employer's breaches, talk to an employment
  lawyer before signing: there are legal routes other than a simple
  resignation.
· This is a general model and does not replace advice from an employment
  lawyer in your country.`,
};
