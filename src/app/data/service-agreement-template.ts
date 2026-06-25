// PROFESSIONAL SERVICE AGREEMENT TEMPLATE
// Comprehensive agreement for ongoing services between service provider and client
// Includes SLA terms, payment schedules, and service level commitments

import { DocumentTemplate } from '../types/document';

export const serviceAgreementTemplate: DocumentTemplate = {
  id: 'service-agreement',
  name: 'Service Agreement',
  description: 'Professional service agreement for ongoing services with scope, deliverables, payment schedule, and service level commitments. Ideal for maintenance contracts, support services, consulting, and recurring professional services.',
  category: 'Business & Contracts',
  price: 9.99,
  fields: [
    // Service Provider Information
    { 
      id: 'provider_name', 
      label: 'Service Provider Full Legal Name', 
      type: 'text', 
      required: true,
      helpText: 'The person or company PROVIDING the services' 
    },
    { 
      id: 'provider_business_name', 
      label: 'Provider Business Name (if different)', 
      type: 'text', 
      required: false,
      helpText: 'DBA or business entity name' 
    },
    { 
      id: 'provider_address', 
      label: 'Provider Address', 
      type: 'textarea', 
      required: true 
    },
    { 
      id: 'provider_email', 
      label: 'Provider Email', 
      type: 'email', 
      required: true 
    },
    { 
      id: 'provider_phone', 
      label: 'Provider Phone', 
      type: 'tel', 
      required: true 
    },
    { 
      id: 'provider_type', 
      label: 'Provider Type', 
      type: 'select', 
      options: ['Individual', 'Corporation', 'LLC', 'Partnership', 'Other Business Entity'], 
      required: true 
    },
    
    // Client Information
    { 
      id: 'client_name', 
      label: 'Client Full Legal Name', 
      type: 'text', 
      required: true,
      helpText: 'The person or company RECEIVING the services' 
    },
    { 
      id: 'client_business_name', 
      label: 'Client Business Name (if applicable)', 
      type: 'text', 
      required: false 
    },
    { 
      id: 'client_address', 
      label: 'Client Address', 
      type: 'textarea', 
      required: true 
    },
    { 
      id: 'client_email', 
      label: 'Client Email', 
      type: 'email', 
      required: true 
    },
    { 
      id: 'client_phone', 
      label: 'Client Phone', 
      type: 'tel', 
      required: true 
    },
    
    // Service Details
    { 
      id: 'service_type', 
      label: 'Type of Services', 
      type: 'select',
      options: [
        'IT Support & Maintenance',
        'Website Hosting & Maintenance',
        'Consulting Services',
        'Marketing & Advertising Services',
        'Accounting & Bookkeeping',
        'Legal Services',
        'Cleaning & Janitorial Services',
        'Security Services',
        'Landscaping & Maintenance',
        'Property Management',
        'Equipment Maintenance',
        'Software as a Service (SaaS)',
        'Managed Services',
        'Professional Services',
        'Other Services'
      ],
      required: true,
      helpText: 'General category of services being provided'
    },
    { 
      id: 'service_description', 
      label: 'Detailed Service Description', 
      type: 'textarea', 
      required: true,
      placeholder: 'Describe in detail the services to be provided, including frequency, scope, and any specific requirements.',
      helpText: 'Be specific about what services will be provided and how often'
    },
    { 
      id: 'service_location', 
      label: 'Service Location', 
      type: 'select',
      options: [
        'On-Site at Client Location',
        'Remote/Off-Site',
        'Hybrid (Both On-Site and Remote)',
        'Provider\'s Location',
        'Various Locations as Needed'
      ],
      required: true 
    },
    { 
      id: 'service_hours', 
      label: 'Service Hours/Schedule', 
      type: 'textarea', 
      required: false,
      placeholder: 'Example: Monday-Friday 9am-5pm, or On-call 24/7, or As needed',
      helpText: 'When services will be available or performed'
    },
    
    // Term and Duration
    { 
      id: 'start_date', 
      label: 'Service Start Date', 
      type: 'date', 
      required: true 
    },
    { 
      id: 'term_type', 
      label: 'Agreement Term Type', 
      type: 'select',
      options: [
        'Month-to-Month',
        'Fixed Term - 3 Months',
        'Fixed Term - 6 Months',
        'Fixed Term - 1 Year',
        'Fixed Term - 2 Years',
        'Fixed Term - 3 Years',
        'Fixed Term - Custom Duration',
        'Ongoing Until Terminated'
      ],
      required: true 
    },
    { 
      id: 'end_date', 
      label: 'End Date (if Fixed Term)', 
      type: 'date', 
      required: false,
      helpText: 'Only if you selected a fixed term' 
    },
    { 
      id: 'auto_renewal', 
      label: 'Automatic Renewal', 
      type: 'select',
      options: [
        'No - Agreement ends on end date',
        'Yes - Auto-renews for same term',
        'Yes - Auto-renews month-to-month',
        'Yes - Auto-renews annually'
      ],
      required: true,
      helpText: 'Whether the agreement automatically renews'
    },
    
    // Payment Terms
    { 
      id: 'payment_structure', 
      label: 'Payment Structure', 
      type: 'select',
      options: [
        'Monthly Recurring Fee',
        'Quarterly Fee',
        'Annual Fee',
        'Per Service/Per Incident Fee',
        'Hourly Rate',
        'Retainer + Hourly Overage',
        'Tiered Pricing',
        'Custom Payment Structure'
      ],
      required: true 
    },
    { 
      id: 'monthly_fee', 
      label: 'Monthly Service Fee ($) - If Applicable', 
      type: 'currency', 
      required: false 
    },
    { 
      id: 'annual_fee', 
      label: 'Annual Service Fee ($) - If Applicable', 
      type: 'currency', 
      required: false 
    },
    { 
      id: 'hourly_rate', 
      label: 'Hourly Rate ($) - If Applicable', 
      type: 'currency', 
      required: false 
    },
    { 
      id: 'payment_schedule', 
      label: 'Payment Schedule/Terms', 
      type: 'textarea', 
      required: true,
      placeholder: 'Example: Payable monthly in advance on the 1st of each month, Net 15 days',
      helpText: 'When and how payments are due'
    },
    { 
      id: 'late_fee', 
      label: 'Late Payment Fee', 
      type: 'select',
      options: [
        'No late fees',
        '1.5% per month on overdue balance',
        '5% of overdue amount',
        'Flat $25 late fee',
        'Flat $50 late fee',
        'Custom late fee terms'
      ],
      required: true 
    },
    { 
      id: 'payment_method', 
      label: 'Accepted Payment Methods', 
      type: 'select',
      options: [
        'Check or Bank Transfer',
        'Credit Card',
        'ACH/Direct Debit',
        'PayPal or Online Payment',
        'Any of the Above'
      ],
      required: true 
    },
    
    // Service Level Agreement (SLA)
    { 
      id: 'sla_included', 
      label: 'Include Service Level Agreement (SLA)?', 
      type: 'select',
      options: ['Yes', 'No'],
      required: true,
      helpText: 'SLA defines response times and service guarantees'
    },
    { 
      id: 'response_time', 
      label: 'Response Time Commitment (if SLA)', 
      type: 'text', 
      required: false,
      placeholder: 'Example: 4 business hours for critical issues, 24 hours for non-critical',
      helpText: 'How quickly provider will respond to service requests'
    },
    { 
      id: 'uptime_guarantee', 
      label: 'Uptime/Availability Guarantee (if applicable)', 
      type: 'text', 
      required: false,
      placeholder: 'Example: 99.9% uptime',
      helpText: 'For services requiring continuous availability'
    },
    
    // Deliverables and Reporting
    { 
      id: 'deliverables', 
      label: 'Deliverables/Reports (if any)', 
      type: 'textarea', 
      required: false,
      placeholder: 'Example: Monthly service reports, maintenance logs, analytics reports, etc.',
      helpText: 'What tangible outputs client will receive'
    },
    
    // Intellectual Property
    { 
      id: 'ip_ownership', 
      label: 'Work Product Ownership', 
      type: 'select',
      options: [
        'Client owns all work product',
        'Provider retains ownership, Client gets license',
        'Shared ownership',
        'Not applicable - no work product created'
      ],
      required: true,
      helpText: 'Who owns materials created during service provision'
    },
    
    // Confidentiality
    { 
      id: 'confidentiality', 
      label: 'Confidentiality Provisions', 
      type: 'select',
      options: [
        'Yes - Include mutual confidentiality terms',
        'Yes - Provider confidentiality only',
        'No - Not needed for these services'
      ],
      required: true 
    },
    
    // Warranties and Disclaimers
    { 
      id: 'service_warranty', 
      label: 'Service Warranty', 
      type: 'select',
      options: [
        'Provider warrants professional workmanlike services',
        'Services provided "as-is" with no warranties',
        'Limited warranty - specific terms to be added',
        'Warranties as required by law only'
      ],
      required: true 
    },
    
    // Liability
    { 
      id: 'liability_cap', 
      label: 'Liability Limitation', 
      type: 'select',
      options: [
        'No limitation on liability',
        'Limited to fees paid in last 12 months',
        'Limited to fees paid in last 6 months',
        'Limited to fees paid in last 3 months',
        'Limited to specific dollar amount',
        'Standard liability limitations apply'
      ],
      required: true 
    },
    { 
      id: 'liability_amount', 
      label: 'Specific Liability Cap Amount ($) - If Applicable', 
      type: 'currency', 
      required: false 
    },
    
    // Insurance
    { 
      id: 'insurance_required', 
      label: 'Insurance Requirements', 
      type: 'select',
      options: [
        'No insurance required',
        'General Liability Insurance required',
        'Professional Liability (E&O) Insurance required',
        'Both General and Professional Liability required',
        'Workers Compensation (if applicable)',
        'Custom insurance requirements'
      ],
      required: true 
    },
    { 
      id: 'insurance_amount', 
      label: 'Minimum Insurance Coverage ($) - If Required', 
      type: 'currency', 
      required: false,
      placeholder: '1000000',
      helpText: 'Example: $1,000,000'
    },
    
    // Termination
    { 
      id: 'termination_notice', 
      label: 'Termination Notice Period', 
      type: 'select',
      options: [
        'Immediate termination allowed',
        '7 Days Written Notice',
        '14 Days Written Notice',
        '30 Days Written Notice',
        '60 Days Written Notice',
        '90 Days Written Notice'
      ],
      required: true 
    },
    { 
      id: 'early_termination_fee', 
      label: 'Early Termination Fee (if Fixed Term)', 
      type: 'select',
      options: [
        'No early termination fee',
        'Remaining balance of contract due',
        'One month service fee',
        'Two months service fee',
        'Three months service fee',
        'Custom early termination terms'
      ],
      required: false,
      helpText: 'Fee if client terminates before end of fixed term'
    },
    
    // Expenses
    { 
      id: 'expenses', 
      label: 'Expenses and Reimbursements', 
      type: 'select',
      options: [
        'No additional expenses - all included in service fee',
        'Pre-approved expenses reimbursed at cost',
        'Expenses billed separately with markup',
        'Client provides all materials and supplies'
      ],
      required: true 
    },
    
    // Governing Law
    { 
      id: 'governing_state', 
      label: 'Governing State Law', 
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
      required: true 
    },
    
    // Additional Terms
    { 
      id: 'additional_terms', 
      label: 'Additional Terms/Special Provisions (Optional)', 
      type: 'textarea', 
      required: false,
      placeholder: 'Any special conditions or additional clauses specific to this service agreement'
    },
  ],
  
  template: `SERVICE AGREEMENT

THIS SERVICE AGREEMENT (the "Agreement") is entered into this {{current_day}} day of {{current_month}}, {{current_year}} (the "Effective Date"), by and between:

SERVICE PROVIDER:
{{provider_name}}
{{#if provider_business_name}}d/b/a {{provider_business_name}}{{/if}}
{{provider_address}}
Email: {{provider_email}}
Phone: {{provider_phone}}
Type: {{provider_type}}
(hereinafter referred to as "Provider" or "Service Provider")

and

CLIENT:
{{client_name}}
{{#if client_business_name}}{{client_business_name}}{{/if}}
{{client_address}}
Email: {{client_email}}
Phone: {{client_phone}}
(hereinafter referred to as "Client")

(Each party may be referred to individually as a "Party" and collectively as the "Parties".)

RECITALS

WHEREAS, Provider is engaged in the business of providing {{service_type}}; and

WHEREAS, Client desires to retain Provider to provide certain services; and

WHEREAS, Provider is willing to provide such services on the terms and conditions set forth in this Agreement.

NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:

--------------------------------------------------

1. SERVICES

1.1. SCOPE OF SERVICES. Provider agrees to provide the following services (the "Services"):

Service Type: {{service_type}}

{{service_description}}

1.2. SERVICE LOCATION. Services will be performed: {{service_location}}

{{#if service_hours}}
1.3. SERVICE HOURS. Services will be available/performed according to the following schedule:
{{service_hours}}
{{/if}}

1.4. STANDARD OF PERFORMANCE. Provider shall perform all Services in a professional and workmanlike manner, consistent with industry standards and best practices. Provider shall devote adequate resources and qualified personnel to the performance of the Services.

1.5. MODIFICATIONS TO SERVICES. Any modifications to the scope of Services must be agreed upon in writing by both Parties and may result in adjustments to fees.

--------------------------------------------------

2. TERM AND TERMINATION

2.1. TERM. This Agreement shall commence on {{start_date}} and shall continue as follows:
    Term Type: {{term_type}}
    {{#if end_date}}End Date: {{end_date}}{{/if}}

2.2. AUTOMATIC RENEWAL. {{auto_renewal}}

If this Agreement auto-renews, either Party may prevent renewal by providing written notice of non-renewal at least thirty (30) days prior to the end of the then-current term.

2.3. TERMINATION FOR CONVENIENCE. Either Party may terminate this Agreement for any reason or no reason by providing the following notice:
    Notice Period: {{termination_notice}}

{{#if early_termination_fee}}
2.4. EARLY TERMINATION FEE. If Client terminates this Agreement before the end of a fixed term:
    {{early_termination_fee}}
{{/if}}

2.5. TERMINATION FOR CAUSE. Either Party may terminate this Agreement immediately upon written notice if:
    (a) The other Party materially breaches this Agreement and fails to cure such breach within fifteen (15) days after receiving written notice;
    (b) The other Party becomes insolvent, files for bankruptcy, or makes an assignment for the benefit of creditors;
    (c) The other Party ceases to conduct business in the normal course.

2.6. EFFECT OF TERMINATION. Upon termination or expiration of this Agreement:
    (a) Client shall pay Provider for all Services satisfactorily performed through the date of termination;
    (b) Provider shall deliver all work product, materials, and Client property to Client;
    (c) All obligations that by their nature should survive termination shall survive, including payment obligations, confidentiality, intellectual property rights, warranties, indemnification, and limitation of liability;
    (d) Neither Party shall be liable to the other for damages resulting from termination in accordance with the terms of this Agreement, except for early termination fees if applicable.

--------------------------------------------------

3. COMPENSATION AND PAYMENT

3.1. SERVICE FEES. Client shall pay Provider as follows:

    Payment Structure: {{payment_structure}}
    {{#if monthly_fee}}Monthly Fee: USD {{monthly_fee}}{{/if}}
    {{#if annual_fee}}Annual Fee: USD {{annual_fee}}{{/if}}
    {{#if hourly_rate}}Hourly Rate: USD {{hourly_rate}} per hour{{/if}}

3.2. PAYMENT TERMS. {{payment_schedule}}

3.3. INVOICING. Provider shall submit invoices to Client according to the payment schedule above. Invoices shall include:
    (a) Invoice number and date;
    (b) Description of Services performed during the billing period;
    (c) Fees due;
    (d) Payment instructions.

3.4. LATE PAYMENTS. {{late_fee}}

If payment is not received when due, Provider may, at its option:
    • Suspend Services until payment is received in full;
    • Charge interest on overdue amounts at the lesser of 1.5% per month or the maximum rate permitted by law;
    • Terminate this Agreement for non-payment after providing written notice and opportunity to cure.

3.5. PAYMENT METHOD. Client may pay by: {{payment_method}}

3.6. TAXES. All fees are exclusive of applicable federal, state, and local sales, use, excise, or other taxes. Client is responsible for all such taxes except taxes based on Provider's net income.

3.7. FEE ADJUSTMENTS. Provider may increase fees upon thirty (30) days' written notice to Client. If Client does not agree to the fee increase, Client may terminate this Agreement upon written notice before the effective date of the increase.

--------------------------------------------------

4. EXPENSES AND REIMBURSEMENTS

4.1. EXPENSES. {{expenses}}

{{#if expenses}}
If expenses are reimbursable, Provider shall:
    (a) Obtain Client's prior written approval for expenses exceeding $500;
    (b) Provide receipts and documentation for all reimbursable expenses;
    (c) Submit expense reports with invoices;
    (d) Seek reimbursement only for reasonable and necessary expenses directly related to the Services.
{{/if}}

--------------------------------------------------

5. SERVICE LEVEL AGREEMENT (SLA)

SLA Included: {{sla_included}}

{{#if response_time}}
5.1. RESPONSE TIME. Provider commits to the following response times:
{{response_time}}

Response time is measured from when Client submits a service request through the designated channel to when Provider acknowledges receipt and begins working on the issue.
{{/if}}

{{#if uptime_guarantee}}
5.2. UPTIME/AVAILABILITY. Provider commits to the following availability standard:
{{uptime_guarantee}}

Downtime excludes scheduled maintenance (with advance notice), force majeure events, and issues caused by Client's systems or third parties.
{{/if}}

{{#if sla_included}}
5.3. SERVICE PRIORITIES. Service requests shall be prioritized as follows:
    • Critical: System down, business operations stopped - Response within [X] hours
    • High: Major functionality impaired - Response within [X] hours
    • Medium: Minor issue, workaround available - Response within [X] business hours
    • Low: General question or enhancement request - Response within [X] business days

5.4. SLA CREDITS. If Provider fails to meet SLA commitments, Client may be entitled to service credits as follows:
    • [Define credit structure if applicable]
    • Service credits are Client's sole remedy for SLA violations.
    • Credits do not apply to issues caused by Client, force majeure, or third parties.
{{/if}}

--------------------------------------------------

6. DELIVERABLES AND REPORTING

{{#if deliverables}}
6.1. DELIVERABLES. Provider shall provide the following deliverables:
{{deliverables}}

6.2. DELIVERY SCHEDULE. Deliverables shall be provided according to the schedule agreed upon by the Parties.

6.3. CLIENT REVIEW. Client shall have [X] business days to review deliverables and provide feedback. Provider shall make reasonable revisions based on Client feedback.
{{else}}
6.1. NO SPECIFIC DELIVERABLES. This Agreement is for the provision of ongoing services and does not require specific deliverables unless otherwise agreed in writing.
{{/if}}

--------------------------------------------------

7. INTELLECTUAL PROPERTY RIGHTS

7.1. WORK PRODUCT OWNERSHIP. {{ip_ownership}}

7.2. PRE-EXISTING MATERIALS. Each Party retains all rights to its pre-existing intellectual property, materials, tools, templates, and know-how developed prior to or outside the scope of this Agreement.

7.3. LICENSE TO PROVIDER. Client grants Provider a non-exclusive license to use Client's trademarks, logos, and materials solely as necessary to perform the Services.

7.4. LICENSE TO CLIENT. If Provider retains ownership of work product, Provider grants Client a perpetual, non-exclusive, royalty-free license to use the work product for Client's business purposes.

7.5. THIRD-PARTY MATERIALS. Provider shall not incorporate third-party materials into work product without Client's consent, unless properly licensed.

--------------------------------------------------

8. CONFIDENTIALITY

Confidentiality: {{confidentiality}}

{{#if confidentiality}}
8.1. CONFIDENTIAL INFORMATION. "Confidential Information" means all non-public information disclosed by one Party (the "Disclosing Party") to the other Party (the "Receiving Party"), whether orally or in writing, that is designated as confidential or that reasonably should be considered confidential given the nature of the information and circumstances of disclosure.

8.2. OBLIGATIONS. The Receiving Party agrees to:
    (a) Hold all Confidential Information in strict confidence;
    (b) Not disclose Confidential Information to third parties without prior written consent;
    (c) Use Confidential Information solely for the purposes of this Agreement;
    (d) Protect Confidential Information using the same degree of care as it uses for its own confidential information, but no less than reasonable care;
    (e) Limit access to Confidential Information to employees and contractors who need to know and who are bound by confidentiality obligations.

8.3. EXCLUSIONS. Confidential Information does not include information that:
    (a) Is or becomes publicly available through no breach of this Agreement;
    (b) Was rightfully possessed by the Receiving Party prior to disclosure;
    (c) Is rightfully received from a third party without confidentiality obligations;
    (d) Is independently developed by the Receiving Party without use of Confidential Information;
    (e) Is required to be disclosed by law or court order (with notice to Disclosing Party if permitted).

8.4. RETURN OF MATERIALS. Upon termination or upon request, the Receiving Party shall return or destroy all Confidential Information and certify such destruction in writing.

8.5. SURVIVAL. Confidentiality obligations shall survive termination of this Agreement for a period of three (3) years.
{{/if}}

--------------------------------------------------

9. WARRANTIES AND DISCLAIMERS

9.1. PROVIDER WARRANTIES. Provider represents and warrants that:
    (a) Provider has the necessary skills, qualifications, and experience to perform the Services;
    (b) {{service_warranty}};
    (c) The Services will not infringe upon or violate any intellectual property rights of third parties;
    (d) Provider has the legal right to enter into this Agreement and perform the Services;
    (e) Provider will comply with all applicable federal, state, and local laws and regulations.

9.2. CLIENT WARRANTIES. Client represents and warrants that:
    (a) Client has the authority to enter into this Agreement;
    (b) Client will provide Provider with necessary access, information, and cooperation to perform the Services;
    (c) Client owns or has rights to use all materials provided to Provider.

9.3. DISCLAIMER. EXCEPT AS EXPRESSLY SET FORTH IN THIS AGREEMENT, PROVIDER MAKES NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. PROVIDER DOES NOT WARRANT THAT SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE.

--------------------------------------------------

10. INDEMNIFICATION

10.1. PROVIDER INDEMNIFICATION. Provider shall indemnify, defend, and hold harmless Client and its officers, directors, employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorney fees) arising out of or relating to:
    (a) Provider's breach of this Agreement;
    (b) Provider's negligence or willful misconduct;
    (c) Claims that Services or work product infringe third-party intellectual property rights;
    (d) Provider's violation of applicable laws;
    (e) Acts or omissions of Provider's employees, agents, or subcontractors.

10.2. CLIENT INDEMNIFICATION. Client shall indemnify, defend, and hold harmless Provider from and against claims arising out of:
    (a) Client's breach of this Agreement;
    (b) Client's negligence or willful misconduct;
    (c) Claims that Client materials infringe third-party rights;
    (d) Client's use of Services in a manner not authorized by this Agreement.

10.3. INDEMNIFICATION PROCEDURE. The indemnified party shall:
    (a) Promptly notify the indemnifying party of any claim;
    (b) Cooperate reasonably with defense of the claim;
    (c) Allow the indemnifying party to control the defense and settlement, provided settlements do not admit liability or impose obligations on the indemnified party without consent.

--------------------------------------------------

11. LIMITATION OF LIABILITY

11.1. LIABILITY CAP. {{liability_cap}}
{{#if liability_amount}}Maximum Liability: USD {{liability_amount}}{{/if}}

EXCEPT FOR BREACHES OF CONFIDENTIALITY, INTELLECTUAL PROPERTY INFRINGEMENT, GROSS NEGLIGENCE, OR WILLFUL MISCONDUCT, PROVIDER'S TOTAL AGGREGATE LIABILITY UNDER THIS AGREEMENT SHALL NOT EXCEED THE AMOUNT SPECIFIED ABOVE.

11.2. EXCLUSION OF DAMAGES. IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOST DATA, BUSINESS INTERRUPTION, OR LOSS OF GOODWILL, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

11.3. ESSENTIAL PURPOSE. The Parties acknowledge that the limitations of liability in this Section are essential elements of the bargain and that Provider would not enter into this Agreement without these limitations.

--------------------------------------------------

12. INSURANCE

Insurance Requirements: {{insurance_required}}

{{#if insurance_amount}}
12.1. COVERAGE AMOUNTS. Provider shall maintain insurance coverage of at least USD {{insurance_amount}} per occurrence.
{{/if}}

{{#if insurance_required}}
12.2. INSURANCE OBLIGATIONS. Provider shall:
    (a) Obtain and maintain required insurance at Provider's expense;
    (b) Provide Client with certificates of insurance upon request;
    (c) Provide thirty (30) days' notice if insurance is cancelled or materially changed;
    (d) Name Client as additional insured on general liability policies (if requested).

12.3. NO LIMITATION. Insurance requirements do not limit Provider's liability or indemnification obligations under this Agreement.
{{/if}}

--------------------------------------------------

13. INDEPENDENT CONTRACTOR RELATIONSHIP

13.1. INDEPENDENT CONTRACTOR. Provider is an independent contractor and not an employee, partner, or joint venturer of Client. Nothing in this Agreement creates an employment, partnership, or agency relationship.

13.2. NO AUTHORITY. Provider has no authority to bind Client or make commitments on Client's behalf without express written authorization.

13.3. TAXES AND BENEFITS. Provider is responsible for all taxes, including self-employment taxes. Provider is not entitled to employee benefits, insurance, or workers' compensation.

13.4. ASSISTANTS. Provider may use assistants or subcontractors to perform Services, provided that:
    (a) Provider obtains Client's prior written approval for subcontractors;
    (b) Provider remains fully responsible for subcontractor performance;
    (c) Subcontractors are bound by the same confidentiality and other obligations as Provider.

--------------------------------------------------

14. CLIENT RESPONSIBILITIES

14.1. COOPERATION. Client shall:
    (a) Provide Provider with reasonable access to Client's facilities, systems, and personnel as needed;
    (b) Provide timely responses to Provider's requests for information or decisions;
    (c) Designate a primary contact person for coordination;
    (d) Review and approve deliverables in a timely manner;
    (e) Pay fees when due.

14.2. CLIENT MATERIALS. Client shall provide Provider with materials, information, and access necessary for Provider to perform the Services. Client represents that it has rights to use and share such materials.

14.3. DELAYS. If Client's failure to fulfill its responsibilities causes delays in Service delivery, Provider shall not be liable for such delays and may be entitled to additional time and compensation.

--------------------------------------------------

15. GENERAL PROVISIONS

15.1. GOVERNING LAW. This Agreement shall be governed by and construed in accordance with the laws of the State of {{governing_state}}, without regard to its conflict of law principles.

15.2. JURISDICTION AND VENUE. Any legal action or proceeding arising under this Agreement shall be brought exclusively in the state or federal courts located in {{governing_state}}, and each Party consents to the jurisdiction of such courts.

15.3. DISPUTE RESOLUTION. Before initiating litigation, the Parties agree to attempt to resolve disputes through good faith negotiation. If negotiation fails within thirty (30) days, either Party may pursue legal remedies.

15.4. ENTIRE AGREEMENT. This Agreement constitutes the entire agreement between the Parties regarding the subject matter hereof and supersedes all prior agreements, understandings, negotiations, and discussions, whether oral or written.

15.5. AMENDMENTS. This Agreement may be amended or modified only by a written instrument signed by both Parties.

15.6. WAIVER. No waiver of any provision shall constitute a waiver of any other provision, nor shall any waiver constitute a continuing waiver unless expressly stated in writing.

15.7. SEVERABILITY. If any provision is held invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.

15.8. ASSIGNMENT. Neither Party may assign this Agreement without the other Party's prior written consent, except that either Party may assign to a successor in connection with a merger, acquisition, or sale of substantially all assets. This Agreement shall bind and benefit the Parties and their permitted successors and assigns.

15.9. NOTICES. All notices under this Agreement shall be in writing and delivered by:
    (a) Email with confirmation of receipt;
    (b) Certified mail, return receipt requested;
    (c) Overnight courier service.

    Notices to Provider: {{provider_email}}
    Notices to Client: {{client_email}}

15.10. FORCE MAJEURE. Neither Party shall be liable for delays or failures in performance due to causes beyond its reasonable control, including acts of God, war, terrorism, strikes, natural disasters, pandemics, or governmental actions.

15.11. COUNTERPARTS. This Agreement may be executed in counterparts, each deemed an original and all together constituting one agreement. Electronic signatures shall have the same effect as original signatures.

15.12. SURVIVAL. Sections that by their nature should survive termination shall survive, including confidentiality, intellectual property, payment obligations, warranties, indemnification, limitation of liability, and dispute resolution.

15.13. HEADINGS. Section headings are for convenience only and shall not affect interpretation.

15.14. RELATIONSHIP OF PROVISIONS. If there is any conflict between provisions of this Agreement, the specific provision shall control over the general provision.

{{#if additional_terms}}
16. ADDITIONAL TERMS

{{additional_terms}}
{{/if}}

--------------------------------------------------

IN WITNESS WHEREOF, the Parties have executed this Service Agreement as of the date first written above.


SERVICE PROVIDER:

_____________________________________
{{provider_name}}
{{#if provider_business_name}}{{provider_business_name}}{{/if}}

Signature: ___________________________

Title (if applicable): ________________

Date: _______________________________


CLIENT:

_____________________________________
{{client_name}}
{{#if client_business_name}}{{client_business_name}}{{/if}}

Signature: ___________________________

Title (if applicable): ________________

Date: _______________________________


--------------------------------------------------

LEGAL DISCLAIMER AND IMPORTANT INFORMATION

This Service Agreement template is provided for informational purposes only and does not constitute legal advice. Service agreements are governed by contract law, which varies by state and can be complex depending on the type of services being provided.

WHEN TO CONSULT AN ATTORNEY:

You should consult with a licensed attorney if:
• Services involve regulated industries (medical, legal, financial services)
• The contract value exceeds $50,000
• Services involve potential safety risks or liability concerns
• You need industry-specific compliance (HIPAA, SOC 2, PCI-DSS, etc.)
• Services involve international parties or cross-border transactions
• You have complex intellectual property considerations
• You need specific performance guarantees or SLA terms with penalties

BEST PRACTICES FOR SERVICE AGREEMENTS:

1. BE SPECIFIC: Clearly define the scope of services, deliverables, timelines, and acceptance criteria.

2. DOCUMENT EVERYTHING: Keep records of all communications, change requests, and approvals.

3. START WITH A TRIAL: Consider a shorter initial term (3-6 months) before committing to a long-term agreement.

4. DEFINE SUCCESS: Establish clear metrics and KPIs to measure service performance.

5. PLAN FOR CHANGES: Include a process for handling scope changes, additional services, and fee adjustments.

6. PROTECT YOUR INTERESTS: Ensure confidentiality, intellectual property, and liability provisions adequately protect your business.

7. REVIEW REGULARLY: Review the agreement periodically to ensure it still meets both parties' needs.

SERVICE AGREEMENT vs. INDEPENDENT CONTRACTOR AGREEMENT:

• SERVICE AGREEMENT: For ongoing, recurring services (monthly maintenance, support, consulting)
• INDEPENDENT CONTRACTOR AGREEMENT: For specific projects or one-time engagements

Choose the agreement type that best matches your business relationship.

STATE-SPECIFIC CONSIDERATIONS:

Different states may have specific requirements for service agreements, including:
• Required disclosures for certain service types
• Licensing requirements for service providers
• Consumer protection laws for certain services
• Limitations on liability clauses or indemnification
• Home improvement contractor regulations
• Specific cancellation rights for consumers

Always research your state's specific requirements or consult with a local attorney.

INDUSTRY-SPECIFIC REGULATIONS:

Certain industries have specific legal and compliance requirements:
• IT Services: Data security, privacy compliance, disaster recovery
• Healthcare: HIPAA compliance, patient privacy, medical liability
• Financial Services: Securities regulations, fiduciary duties, compliance
• Legal Services: Attorney-client privilege, ethical rules, conflict of interest
• Construction/Contracting: Licensing, permits, mechanic's liens, building codes

Ensure your agreement addresses industry-specific legal requirements.

--------------------------------------------------

This Service Agreement was generated on {{current_month}} {{current_day}}, {{current_year}}.

BOTH PARTIES SHOULD RETAIN A SIGNED COPY FOR THEIR RECORDS.`
};
