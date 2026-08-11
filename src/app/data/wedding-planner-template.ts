// WEDDING PLANNER AGREEMENT — English version
//
// Written for the case the generic models skip: the planner works from one
// city and the event happens in another. The hard questions there aren't
// legal, they're logistical — how many times does she travel out, who pays
// for it, who signs with the vendors, when does she arrive — and those are
// exactly the ones that break trust when nobody wrote them down.
//
// Hence the two separate clauses for what the service INCLUDES and what it
// does NOT. A services contract that only lists what's included lets each
// side imagine something different about the rest, and that gap always shows
// up in the week of the event, when it can no longer be fixed.
//
// The Spanish version lives in wedding-planner-es.ts and must keep the SAME
// field ids and the options in the SAME order: the Spanish form labels are
// derived by pairing both files positionally (see registrarPareja in
// field-translations.ts).

import { DocumentTemplate } from '../types/document';

export const weddingPlannerTemplate: DocumentTemplate = {
  id: 'wedding-planner',
  name: 'Wedding Planner Agreement',
  description: 'A planning and coordination agreement for weddings and events, built for the case where the planner and the venue are in different cities. Spells out what the service includes and what it does not, site visits, how vendors are hired, payments, changes, cancellation and rescheduling. Fully editable and can be signed digitally.',
  category: 'Events & Celebrations',
  price: 9.00,
  fields: [
    // ── Who provides the service ──────────────────────────────────────────
    {
      id: 'planner_name',
      label: 'Planner or company name',
      type: 'text',
      required: true,
      placeholder: 'As it should appear in the agreement',
    },
    {
      id: 'planner_id',
      label: 'Planner ID or tax number',
      type: 'text',
      required: true,
    },
    {
      id: 'planner_city',
      label: 'City the planner works from',
      type: 'text',
      required: true,
      helpText: 'If it differs from the event city, the travel and site-visit clauses kick in.',
    },
    {
      id: 'planner_phone',
      label: 'Planner phone number',
      type: 'tel',
      required: true,
    },
    {
      id: 'planner_email',
      label: 'Planner email',
      type: 'email',
      required: false,
    },

    // ── Who hires ─────────────────────────────────────────────────────────
    {
      id: 'client_name',
      label: 'Your full name',
      type: 'text',
      required: true,
      placeholder: 'As it appears on your ID',
    },
    {
      id: 'client_id',
      label: 'Your ID number',
      type: 'text',
      required: true,
    },
    {
      id: 'client_phone',
      label: 'Your phone number',
      type: 'tel',
      required: true,
    },
    {
      id: 'client_email',
      label: 'Your email',
      type: 'email',
      required: false,
    },
    {
      id: 'partner_name',
      label: "Your partner's name",
      type: 'text',
      required: false,
      helpText: 'Only if you are both getting married and you want them named in the agreement.',
    },

    // ── The event ─────────────────────────────────────────────────────────
    {
      id: 'event_type',
      label: 'Type of event',
      type: 'select',
      required: true,
      options: [
        'Wedding',
        'Civil ceremony',
        'Symbolic ceremony or vow renewal',
        'Quinceañera',
        'Anniversary',
        'Graduation',
        'Birthday',
        'Corporate event',
        'Other celebration',
      ],
    },
    {
      id: 'event_date',
      label: 'Event date',
      type: 'date',
      required: true,
    },
    {
      id: 'event_time',
      label: 'Start time',
      type: 'text',
      required: false,
      placeholder: '4:00 PM',
    },
    {
      id: 'event_venue',
      label: 'Venue',
      type: 'text',
      required: true,
      placeholder: 'Name of the hall, estate or hotel',
    },
    {
      id: 'event_city',
      label: 'Event city',
      type: 'text',
      required: true,
    },
    {
      id: 'guest_count',
      label: 'Approximate number of guests',
      type: 'number',
      required: true,
      helpText: 'An estimate. The agreement sets below how late it can still be adjusted.',
    },

    // ── Scope ─────────────────────────────────────────────────────────────
    {
      id: 'services_included',
      label: 'What the service includes',
      type: 'textarea',
      required: true,
      placeholder: 'Concept design, sourcing and selecting vendors, site visits, timeline, day-of coordination…',
      helpText: 'The most important part of the agreement. You can dictate it with the microphone and then press "Improve with AI" to tidy it up.',
    },
    {
      id: 'services_excluded',
      label: 'What it does NOT include',
      type: 'textarea',
      required: false,
      placeholder: 'Vendor costs, venue rental, attire, honeymoon, civil or religious paperwork…',
      helpText: 'Writing this down prevents ninety percent of the misunderstandings. Anything not listed here or above is not contracted.',
    },
    {
      id: 'onsite_visits',
      label: 'Site visits included before the event',
      type: 'number',
      required: true,
      placeholder: '2',
      helpText: 'How many times the planner travels to the venue before the day.',
    },
    {
      id: 'arrival_days_before',
      label: 'Days before the event the planner arrives in town',
      type: 'number',
      required: false,
      placeholder: '2',
    },
    {
      id: 'event_day_hours',
      label: 'Hours of coverage on the event day',
      type: 'number',
      required: false,
      placeholder: '12',
    },
    {
      id: 'team_size',
      label: 'Team members on the event day',
      type: 'number',
      required: false,
      placeholder: '3',
    },
    {
      id: 'response_time_hours',
      label: 'Maximum reply time to messages (business hours)',
      type: 'number',
      required: false,
      placeholder: '24',
    },
    {
      id: 'travel_costs',
      label: 'Travel, transport and lodging costs',
      type: 'select',
      required: true,
      options: [
        'Included in the fee',
        'Paid by the client, on top of the fee',
        'Shared between the parties',
      ],
    },
    {
      id: 'vendor_contracting',
      label: 'Who hires the vendors',
      type: 'select',
      required: true,
      options: [
        'The client hires and pays each vendor; the planner only coordinates',
        'The planner hires on the client behalf, with prior written approval',
        'Mixed: some hired by the planner, some by the client',
      ],
    },

    // ── Money ─────────────────────────────────────────────────────────────
    {
      id: 'currency_code',
      label: 'Currency',
      type: 'select',
      required: true,
      options: ['COP', 'USD', 'MXN', 'EUR', 'ARS', 'CLP', 'PEN'],
    },
    {
      id: 'total_fee',
      label: 'Total planner fee',
      type: 'currency',
      required: true,
      helpText: 'The planning and coordination work only, not the cost of the vendors.',
    },
    {
      id: 'deposit_amount',
      label: 'Deposit to hold the date',
      type: 'currency',
      required: true,
    },
    {
      id: 'payment_plan',
      label: 'How the balance is paid',
      type: 'textarea',
      required: true,
      placeholder: 'A second payment of 40% three months out and the balance fifteen days before the event.',
    },
    {
      id: 'final_payment_days',
      label: 'Days before the event the balance is due',
      type: 'number',
      required: true,
      placeholder: '15',
    },
    {
      id: 'extra_hours_rate',
      label: 'Rate per extra hour on the event day',
      type: 'currency',
      required: false,
    },

    // ── Protections ───────────────────────────────────────────────────────
    {
      id: 'changes_deadline_days',
      label: 'Days before the event when changes close',
      type: 'number',
      required: false,
      placeholder: '30',
      helpText: 'After that date vendors are already confirmed and changes cost money.',
    },
    {
      id: 'cancellation_policy',
      label: 'Cancellation policy',
      type: 'select',
      required: true,
      options: [
        'Tiered: 30% retained if cancelled more than 90 days out, 60% between 89 and 30 days, 100% under 30 days',
        'The deposit is non-refundable; the rest is refunded if cancelled more than 30 days out',
        'Neither the deposit nor any amount already paid is refundable',
        'Custom (described under special terms)',
      ],
    },
    {
      id: 'portfolio_use',
      label: 'Planner use of photos and video of the event',
      type: 'select',
      required: true,
      options: [
        'Yes, may use them in portfolio and social media',
        'Yes, but without naming the couple',
        'No use of images is authorised',
      ],
    },
    {
      id: 'governing_city',
      label: 'City whose courts settle a dispute',
      type: 'text',
      required: true,
      helpText: 'Usually the event city or the client home city.',
    },
    {
      id: 'special_terms',
      label: 'Special terms',
      type: 'textarea',
      required: false,
      helpText: 'Anything agreed that does not fit above. You can dictate it.',
    },
  ],

  template: `EVENT PLANNING AND COORDINATION AGREEMENT


Between the undersigned:

{{planner_name}}, holder of ID number {{planner_id}}, based in {{planner_city}}, hereinafter THE PLANNER;

and

{{client_name}}, holder of ID number {{client_id}}{{#if partner_name}}, together with {{partner_name}}{{/if}}, hereinafter THE CLIENT;

this agreement is entered into under the following terms.


ONE — PURPOSE

THE PLANNER agrees to provide THE CLIENT with professional planning, advisory and coordination services for the event described in clause two, on the terms and within the scope this agreement defines.

THE PLANNER provides the service independently, with her own team and her own means. This agreement creates no employment, subordination or exclusivity relationship between the parties.


TWO — THE EVENT

Type of event: {{event_type}}
Date: {{event_date}}{{#if event_time}}
Start time: {{event_time}}{{/if}}
Venue: {{event_venue}}
City: {{event_city}}
Approximate number of guests: {{guest_count}}

The date is held for THE CLIENT only from the moment the deposit set out in clause eight is paid. Before that payment, THE PLANNER may accept another event for the same day.


THREE — WHAT THE SERVICE INCLUDES

THE PLANNER undertakes to provide the following:

{{services_included}}

In addition, and in every case:

a) Deliver to THE CLIENT a work plan showing when each decision has to be made.
b) Present vendor options for every need of the event, with their quotes, without concealing commissions or her own arrangements with them.
c) Draw up the day-of timeline and share it with THE CLIENT and with every vendor ahead of the date.
d) Coordinate setup, the event itself and teardown within the agreed hours.
e) Be the single point of contact with the vendors on the day of the event, so that THE CLIENT has nothing to resolve that day.


FOUR — WHAT THE SERVICE DOES NOT INCLUDE

The fee under this agreement pays for THE PLANNER's work. Unless separately agreed in writing, it does not cover:

{{#if services_excluded}}{{services_excluded}}

And in any case it also does not cover:{{/if}}
a) The cost of vendors, venue, food, drink, music, décor, attire or any other goods or services engaged for the event.
b) Civil, notarial or religious formalities of the marriage, or the documents they require.
c) Transport, lodging or meals for the guests.
d) Any service not written into clause three.

Anything absent from clause three is not contracted. If THE CLIENT requests it later, the parties will agree its scope and price in writing before it is carried out.


FIVE — WORKING FROM A DIFFERENT CITY

The parties acknowledge that THE PLANNER works from {{planner_city}} and that the event takes place in {{event_city}}. They therefore expressly agree:

a) THE PLANNER will make {{onsite_visits}} site visit(s) to the venue before the date. Any additional visit requested by THE CLIENT is charged separately, by prior written agreement.{{#if arrival_days_before}}
b) THE PLANNER will arrive in {{event_city}} {{arrival_days_before}} day(s) in advance and remain available until the event ends.{{/if}}
c) The rest of the planning is done by video call, phone and email. Decisions taken through those channels carry the same weight as those taken in person, provided they are put in writing.{{#if response_time_hours}}
d) THE PLANNER will answer THE CLIENT's messages within {{response_time_hours}} business hours. This does not apply during setup days or on the event day, when she is dedicated to execution.{{/if}}
e) Each party will keep its contact details current. Communications are deemed received when sent to the channels stated in this agreement.


SIX — VENDORS

Agreed arrangement: {{vendor_contracting}}

Under any arrangement:

a) THE CLIENT approves every vendor and every budget in writing before it is confirmed.
b) THE PLANNER is not liable for the breach, delay or poor quality of a vendor engaged by THE CLIENT. Her duty is to select diligently, to warn of the risks she is aware of, and to do everything reasonable to solve the problem during the event.
c) Where THE PLANNER contracts on behalf of THE CLIENT, she does so for their account and with the funds they provide. She advances no money of her own unless she accepts to in writing.
d) THE PLANNER will disclose to THE CLIENT any commission, discount or benefit she receives from a vendor.


SEVEN — TRAVEL COSTS

Transport, lodging and meal costs for THE PLANNER and her team, needed for the visits and for the event, are handled as follows: {{travel_costs}}.

Where they fall on THE CLIENT, THE PLANNER will quote them in advance and support them with receipts. THE CLIENT is not obliged to reimburse a cost they did not approve beforehand.


EIGHT — FEE AND PAYMENT

Total fee: {{currency_code}} {{total_fee}}

Deposit to hold the date: {{currency_code}} {{deposit_amount}}, payable on signing this agreement. This payment counts towards the total fee.

Balance: {{payment_plan}}

The final payment must be made no later than {{final_payment_days}} day(s) before the event. THE PLANNER is not obliged to run the event if the balance has not been paid by that date.{{#if extra_hours_rate}}

Each hour of coverage beyond the agreed hours on the event day is charged at {{currency_code}} {{extra_hours_rate}}.{{/if}}{{#if event_day_hours}}

Coverage on the event day is {{event_day_hours}} continuous hours.{{/if}}{{#if team_size}} THE PLANNER will attend with a team of {{team_size}} person(s).{{/if}}


NINE — CHANGES

THE CLIENT may request changes to the design, the vendors or the guest count, in writing.{{#if changes_deadline_days}} Changes are accepted up to {{changes_deadline_days}} day(s) before the event; after that date vendors are already confirmed and only changes that are materially possible and whose extra cost THE CLIENT covers will be accepted.{{/if}}

Any change that increases the cost of the event or THE PLANNER's workload will be agreed in writing, with its price, before it is carried out.


TEN — CANCELLATION BY THE CLIENT

If THE CLIENT cancels the event, the following applies: {{cancellation_policy}}.

This is without prejudice to amounts already paid to vendors, which are governed by what was agreed with each of them and which THE PLANNER cannot refund.

Cancellation must be communicated in writing. The date of that communication determines the applicable percentage.


ELEVEN — CANCELLATION BY THE PLANNER

THE PLANNER may only terminate this agreement before the event for serious cause: THE CLIENT's failure to pay, medical impossibility or force majeure, or disrespectful or abusive treatment towards her or her team.

If she terminates without cause, she will refund THE CLIENT everything paid and will additionally cooperate by handing over all event information and vendor contacts so that someone else can continue.

If the cause is medical impossibility or force majeure, THE PLANNER will do everything possible to find a suitable replacement and will refund the portion of the fee corresponding to work not performed.


TWELVE — RESCHEDULING AND FORCE MAJEURE

If the event has to be postponed because of an event outside the parties' control — an order from the authorities, a natural disaster, a health emergency, the death of a close relative — the parties will agree a new date and this agreement remains in force for it, with no penalty.

Fees already paid are credited to the new date. If THE PLANNER is already committed to another event on the new date, she will refund what was paid, less the work actually performed up to that point.

Non-recoverable amounts already paid to vendors are not THE PLANNER's responsibility.


THIRTEEN — LIABILITY

THE PLANNER is answerable for the diligence of her own work. She is not answerable for the acts of third parties, for the weather, for decisions THE CLIENT took against her written recommendation, or for damage occurring at the venue that falls on THE CLIENT or their guests.

In any case, THE PLANNER's total liability under this agreement will not exceed the fees actually paid.


FOURTEEN — THE CLIENT'S OBLIGATIONS

a) Pay on the agreed dates.
b) Provide in good time the information THE PLANNER requests: guest list, menu decisions, ceremony timings and the like.
c) Make the decisions that fall to them within the deadlines of the work plan. A delay in deciding can mean a vendor is no longer available, and that consequence is not attributable to THE PLANNER.
d) Treat THE PLANNER, her team and the vendors with respect.


FIFTEEN — IMAGES OF THE EVENT

On THE PLANNER's use of photographs and video of the event: {{portfolio_use}}.

Where granted, this authorisation is free of charge, non-exclusive and limited to showcasing her professional work. It does not allow the images to be assigned to third parties for unrelated advertising, nor used in a context that harms THE CLIENT's reputation or privacy. THE CLIENT may revoke it at any time in writing, and THE PLANNER will remove the images from the channels she controls.


SIXTEEN — DESIGN AND CONFIDENTIALITY

The concepts, sketches, palettes and proposals created by THE PLANNER remain hers until the event is paid in full; from that moment THE CLIENT may use them freely for their own event. Neither party may resell them as their own to a third party.

Both parties will keep confidential the personal, family and financial information they learn by reason of this agreement, including after it ends.

{{#if special_terms}}
SEVENTEEN — SPECIAL TERMS

{{special_terms}}

{{/if}}
FINAL CLAUSE — ENTIRE AGREEMENT, AMENDMENTS AND DISPUTES

This document contains everything agreed between the parties and supersedes any earlier conversation or quote. It may only be amended in writing signed by both.

If any clause turns out to be invalid, the remainder stays in force.

The parties will try in good faith to resolve any difference by direct conversation and, failing that, will submit to the courts of {{governing_city}}, waiving any other venue.

In witness whereof, the parties sign in {{governing_city}} on {{current_date}}.


THE PLANNER

_______________________________________
{{planner_name}}
ID {{planner_id}}
{{planner_phone}}{{#if planner_email}}
{{planner_email}}{{/if}}

THE CLIENT

_______________________________________
{{client_name}}
ID {{client_id}}
{{client_phone}}{{#if client_email}}
{{client_email}}{{/if}}{{#if partner_name}}
_______________________________________
{{partner_name}}{{/if}}

---------------------------------------------------------------------------

NOTE FOR THE SIGNER — not part of the agreement

· Check that clause three really lists everything you expect to receive.
  Whatever was discussed over chat and never written there is not contracted.
· Keep every vendor approval in writing, even by email. That is what
  prevents last-minute arguments about who authorised what.
· This is a general model. It does not replace advice from a lawyer in your
  country, especially for a destination event or high-value budgets.`,
};
