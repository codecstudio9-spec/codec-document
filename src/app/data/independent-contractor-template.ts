// PROFESSIONAL INDEPENDENT CONTRACTOR AGREEMENT TEMPLATE
// Comprehensive agreement for hiring independent contractors/freelancers
// IRS-compliant to establish proper contractor relationship

import { DocumentTemplate } from '../types/document';

export const independentContractorTemplate: DocumentTemplate = {
  id: 'independent-contractor',
  name: 'Independent Contractor Agreement',
  description: 'Professional agreement for hiring freelancers and independent contractors. IRS-compliant with clear scope of work, payment terms, intellectual property rights, and contractor status definition.',
  category: 'Business & Contracts',
  price: 9.99,
  fields: [
    // Client/Company Information
    { 
      id: 'client_name', 
      label: 'Client/Company Full Legal Name', 
      type: 'text', 
      required: true,
      helpText: 'The person or company HIRING the contractor' 
    },
    { 
      id: 'client_address', 
      label: 'Client/Company Address', 
      type: 'textarea', 
      required: true 
    },
    { 
      id: 'client_email', 
      label: 'Client/Company Email', 
      type: 'email', 
      required: true 
    },
    { 
      id: 'client_phone', 
      label: 'Client/Company Phone', 
      type: 'tel', 
      required: false 
    },
    { 
      id: 'client_type', 
      label: 'Client/Company Type', 
      type: 'select', 
      options: ['Individual', 'Corporation', 'LLC', 'Partnership', 'Other Business Entity'], 
      required: true 
    },
    
    // Contractor Information
    { 
      id: 'contractor_name', 
      label: 'Contractor Full Legal Name', 
      type: 'text', 
      required: true,
      helpText: 'The person or entity PROVIDING services'
    },
    { 
      id: 'contractor_business_name', 
      label: 'Contractor Business Name (if applicable)', 
      type: 'text', 
      required: false,
      helpText: 'DBA or business entity name'
    },
    { 
      id: 'contractor_address', 
      label: 'Contractor Address', 
      type: 'textarea', 
      required: true 
    },
    { 
      id: 'contractor_email', 
      label: 'Contractor Email', 
      type: 'email', 
      required: true 
    },
    { 
      id: 'contractor_phone', 
      label: 'Contractor Phone', 
      type: 'tel', 
      required: false 
    },
    { 
      id: 'contractor_ssn_ein', 
      label: 'Contractor SSN or EIN (Last 4 digits only)', 
      type: 'text', 
      required: false,
      placeholder: 'XXXX',
      helpText: 'For 1099 tax reporting purposes. Only include last 4 digits for security.'
    },
    
    // Project/Services Information
    { 
      id: 'services_description', 
      label: 'Detailed Description of Services', 
      type: 'textarea', 
      required: true,
      placeholder: 'Example: Web development services including design, coding, testing, and deployment of a custom e-commerce website with payment gateway integration.',
      helpText: 'Be specific about what services the contractor will provide'
    },
    { 
      id: 'deliverables', 
      label: 'Specific Deliverables', 
      type: 'textarea', 
      required: true,
      placeholder: 'Example:\n- Fully functional e-commerce website\n- Mobile-responsive design\n- Admin dashboard\n- User documentation',
      helpText: 'List all expected deliverables'
    },
    
    // Term and Duration
    { 
      id: 'contract_type', 
      label: 'Contract Duration Type', 
      type: 'select', 
      options: [
        'Fixed Term - Specific End Date',
        'Project-Based - Until Completion',
        'Ongoing - Until Terminated',
        'Fixed Term with Option to Renew'
      ], 
      required: true 
    },
    { 
      id: 'end_date', 
      label: 'Contract End Date (if Fixed Term)', 
      type: 'date', 
      required: false,
      helpText: 'Only if you selected "Fixed Term"'
    },
    { 
      id: 'estimated_completion', 
      label: 'Estimated Completion Date (if Project-Based)', 
      type: 'date', 
      required: false 
    },
    
    // Compensation
    { 
      id: 'payment_structure', 
      label: 'Payment Structure', 
      type: 'select', 
      options: [
        'Fixed Fee - One-Time Payment',
        'Fixed Fee - Milestone-Based',
        'Hourly Rate',
        'Monthly Retainer',
        'Commission-Based',
        'Hybrid - Fixed Fee + Hourly'
      ], 
      required: true 
    },
    { 
      id: 'fixed_fee', 
      label: 'Fixed Fee Amount ($) - If Applicable', 
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
      id: 'monthly_retainer', 
      label: 'Monthly Retainer Amount ($) - If Applicable', 
      type: 'currency', 
      required: false 
    },
    { 
      id: 'payment_schedule', 
      label: 'Payment Schedule/Terms', 
      type: 'textarea', 
      required: true,
      placeholder: 'Example: 50% upfront, 25% at midpoint, 25% upon completion. Net 15 days.',
      helpText: 'When and how payments will be made'
    },
    { 
      id: 'expenses_reimbursement', 
      label: 'Expense Reimbursement', 
      type: 'select', 
      options: [
        'No - Contractor pays all expenses',
        'Yes - Pre-approved expenses only',
        'Yes - All reasonable business expenses'
      ], 
      required: true 
    },
    
    // Work Details
    { 
      id: 'work_location', 
      label: 'Work Location', 
      type: 'select', 
      options: [
        'Remote - Contractor\'s Location',
        'On-Site - Client\'s Location',
        'Hybrid - Both Remote and On-Site',
        'Flexible - As Needed'
      ], 
      required: true 
    },
    { 
      id: 'work_hours', 
      label: 'Work Hours/Schedule', 
      type: 'textarea', 
      required: false,
      placeholder: 'Example: Flexible hours, contractor sets own schedule. Available for meetings M-F 9am-5pm EST.',
      helpText: 'Describe expected availability (but remember: contractor controls their schedule)'
    },
    
    // Intellectual Property
    { 
      id: 'ip_ownership', 
      label: 'Intellectual Property Ownership', 
      type: 'select', 
      options: [
        'Work for Hire - Client owns all IP',
        'Client owns IP after final payment',
        'Contractor retains IP, Client gets license',
        'Shared/Joint Ownership'
      ], 
      required: true,
      helpText: 'Who owns the work product created?'
    },
    
    // Confidentiality
    { 
      id: 'confidentiality', 
      label: 'Confidentiality Clause', 
      type: 'select', 
      options: [
        'Yes - Include standard confidentiality terms',
        'No - Not needed for this project'
      ], 
      required: true 
    },
    
    // Non-Compete and Non-Solicitation
    { 
      id: 'non_compete', 
      label: 'Non-Compete Clause (Use with Caution)', 
      type: 'select', 
      options: ['No', 'Yes'], 
      required: true,
      helpText: 'May not be enforceable for independent contractors in many states'
    },
    { 
      id: 'non_compete_duration', 
      label: 'Non-Compete Duration (Months) - If Yes', 
      type: 'number', 
      required: false,
      placeholder: '6'
    },
    { 
      id: 'non_solicitation', 
      label: 'Non-Solicitation Clause', 
      type: 'select', 
      options: ['No', 'Yes'], 
      required: true,
      helpText: 'Prevents contractor from soliciting clients/employees'
    },
    { 
      id: 'non_solicitation_duration', 
      label: 'Non-Solicitation Duration (Months) - If Yes', 
      type: 'number', 
      required: false,
      placeholder: '12'
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
        'Both General and Professional Liability required'
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
        'Immediate - Either party can terminate anytime',
        '7 Days Written Notice',
        '14 Days Written Notice',
        '30 Days Written Notice',
        '60 Days Written Notice'
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
      placeholder: 'Any special conditions or additional clauses'
    },
  ],
  
  template: `INDEPENDENT CONTRACTOR AGREEMENT

THIS INDEPENDENT CONTRACTOR AGREEMENT (the "Agreement") is entered into this {{current_day}} day of {{current_month}}, {{current_year}} (the "Effective Date"), by and between:

CLIENT:
{{client_name}}
{{client_address}}
Email: {{client_email}}
{{#if client_phone}}Phone: {{client_phone}}{{/if}}
Type: {{client_type}}
(hereinafter referred to as "Client" or "Company")

and

CONTRACTOR:
{{contractor_name}}
{{#if contractor_business_name}}Business Name: {{contractor_business_name}}{{/if}}
{{contractor_address}}
Email: {{contractor_email}}
{{#if contractor_phone}}Phone: {{contractor_phone}}{{/if}}
{{#if contractor_ssn_ein}}Tax ID (Last 4): XXXXX{{contractor_ssn_ein}}{{/if}}
(hereinafter referred to as "Contractor")

(Each party may be referred to individually as a "Party" and collectively as the "Parties".)

RECITALS

WHEREAS, Client desires to retain Contractor to provide certain services; and

WHEREAS, Contractor represents that they are qualified and willing to provide such services on the terms and conditions set forth herein; and

WHEREAS, the Parties intend that Contractor shall perform services as an independent contractor and not as an employee of Client.

NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:

1. SERVICES AND DELIVERABLES

1.1. SCOPE OF SERVICES. Contractor agrees to provide the following services (the "Services"):

{{services_description}}

1.2. DELIVERABLES. Contractor shall deliver the following specific work products (the "Deliverables"):

{{deliverables}}

1.3. STANDARD OF PERFORMANCE. Contractor shall perform all Services in a professional and workmanlike manner, consistent with industry standards and best practices. All Deliverables shall be of high quality and fit for their intended purpose.

1.4. CLIENT APPROVAL. [Optional] Client shall have the right to review and approve Deliverables. Client shall provide feedback within [X] business days of receipt. Contractor shall make reasonable revisions based on Client's feedback.

2. TERM AND TERMINATION

2.1. TERM. This Agreement shall commence on {{start_date}} and shall continue until:
   {{contract_type}}
   {{#if end_date}}End Date: {{end_date}}{{/if}}

{{#if estimated_completion}}
2.2. ESTIMATED COMPLETION. The Parties anticipate that the Services will be completed by {{estimated_completion}}. This is an estimate only and not a binding deadline unless otherwise specified in writing.
{{/if}}

2.3. TERMINATION FOR CONVENIENCE. Either Party may terminate this Agreement for any reason or no reason by providing written notice to the other Party as follows: {{termination_notice}}

2.4. TERMINATION FOR CAUSE. Either Party may terminate this Agreement immediately upon written notice if the other Party:
   (a) Materially breaches any provision of this Agreement and fails to cure such breach within ten (10) days after receiving written notice thereof;
   (b) Becomes insolvent, makes an assignment for the benefit of creditors, or files for bankruptcy;
   (c) Ceases to conduct business in the normal course.

2.5. EFFECT OF TERMINATION. Upon termination:
   (a) Contractor shall immediately cease performing Services;
   (b) Contractor shall deliver all completed and partially completed Deliverables to Client;
   (c) Client shall pay Contractor for all Services satisfactorily performed up to the date of termination, including any approved expenses incurred;
   (d) All sections that by their nature should survive termination shall survive, including Sections 4 (Payment), 6 (Intellectual Property), 7 (Confidentiality), and 9 (Indemnification).

3. INDEPENDENT CONTRACTOR STATUS

3.1. RELATIONSHIP OF PARTIES. Contractor is an independent contractor and not an employee, partner, or joint venturer of Client. Nothing in this Agreement shall be construed to create an employer-employee, partnership, or agency relationship between the Parties.

3.2. CONTRACTOR ACKNOWLEDGES AND AGREES:
   (a) Contractor has the right to control and determine the time, place, manner, and means of performing the Services;
   (b) Contractor shall provide their own tools, equipment, and materials necessary to perform the Services;
   (c) Contractor may perform services for other clients and is not economically dependent on Client;
   (d) Contractor is responsible for all taxes, including federal, state, and local income taxes, self-employment taxes, and any other applicable taxes;
   (e) Contractor is not entitled to any employee benefits, including health insurance, retirement benefits, paid time off, or unemployment compensation;
   (f) Client will not withhold any taxes from payments to Contractor;
   (g) Client will issue IRS Form 1099-NEC to Contractor if total payments exceed $600 in a calendar year;
   (h) Contractor is responsible for obtaining any necessary licenses, permits, or certifications required to perform the Services;
   (i) Contractor may hire assistants or subcontractors at Contractor's own expense, subject to Client's prior approval.

3.3. NO AUTHORITY TO BIND. Contractor has no authority to enter into contracts, make commitments, or incur liabilities on behalf of Client without Client's prior written consent.

3.4. LOCATION AND SCHEDULE. Contractor shall perform Services:
   Location: {{work_location}}
   {{#if work_hours}}Schedule: {{work_hours}}{{/if}}

   Contractor retains the right to determine their own work schedule and may work from any location unless on-site presence is specifically required for certain tasks.

4. COMPENSATION AND PAYMENT

4.1. PAYMENT STRUCTURE. Client shall compensate Contractor as follows:
   Payment Type: {{payment_structure}}
   {{#if fixed_fee}}Fixed Fee: USD {{fixed_fee}}{{/if}}
   {{#if hourly_rate}}Hourly Rate: USD {{hourly_rate}} per hour{{/if}}
   {{#if monthly_retainer}}Monthly Retainer: USD {{monthly_retainer}} per month{{/if}}

4.2. PAYMENT TERMS. Payment shall be made according to the following schedule:
   {{payment_schedule}}

4.3. INVOICING. Contractor shall submit invoices to Client according to the payment schedule above. Invoices shall include:
   (a) Invoice number and date;
   (b) Description of Services performed or Deliverables completed;
   (c) Total amount due;
   (d) Payment instructions.

4.4. PAYMENT DUE DATE. All invoices are due within the timeframe specified in Section 4.2 unless otherwise agreed in writing. Late payments shall accrue interest at the rate of 1.5% per month or the maximum rate permitted by law, whichever is less.

4.5. EXPENSES. {{expenses_reimbursement}}
   If expenses are reimbursable, Contractor must obtain Client's prior written approval for expenses exceeding reasonable amounts. Contractor shall provide receipts for all reimbursable expenses.

4.6. NO EMPLOYEE BENEFITS. Contractor acknowledges that they are not entitled to any employee benefits and that Client will not provide health insurance, retirement benefits, paid time off, or any other benefits typically provided to employees.

5. WORK PRODUCT AND QUALITY

5.1. ORIGINAL WORK. Contractor represents and warrants that all Services and Deliverables shall be Contractor's original work and shall not infringe upon or violate any copyright, patent, trademark, trade secret, or other intellectual property right of any third party.

5.2. WARRANTIES. Contractor warrants that:
   (a) Contractor has the necessary skills, qualifications, and experience to perform the Services;
   (b) The Services will be performed in a professional and workmanlike manner;
   (c) The Deliverables will be free from material defects and fit for their intended purpose;
   (d) Contractor has the legal right to enter into this Agreement and perform the Services.

5.3. WARRANTY PERIOD. [Optional] Contractor warrants that Deliverables will be free from defects for a period of [X] days after delivery. If Client discovers any defects during this period, Contractor shall correct such defects at no additional charge.

6. INTELLECTUAL PROPERTY RIGHTS

6.1. OWNERSHIP OF WORK PRODUCT.
   IP Ownership Model: {{ip_ownership}}
   
   All work product, including Services and Deliverables, shall be handled according to the ownership model selected above. Client and Contractor agree to execute any additional documents necessary to effectuate the chosen ownership arrangement.

6.2. PRE-EXISTING MATERIALS. Contractor retains all rights to any pre-existing materials, tools, templates, or intellectual property created prior to this Agreement or outside the scope of this Agreement (collectively, "Pre-Existing Materials"). Client is granted a non-exclusive license to use Pre-Existing Materials solely as incorporated into the Deliverables.

6.3. CONTRACTOR PORTFOLIO. Contractor may include the work product in Contractor's portfolio and use it for marketing purposes, unless Client objects in writing within thirty (30) days of delivery.

6.4. MORAL RIGHTS. Contractor irrevocably waives any moral rights, rights of attribution, or rights of integrity that Contractor may have in the work product.

7. CONFIDENTIALITY

Confidentiality Terms: {{confidentiality}}

If confidentiality protections apply, the Receiving Party agrees to hold all Confidential Information in strict confidence, not disclose it to third parties, and use it solely for the purpose of this Agreement. Confidential Information does not include information that is publicly available, rightfully possessed prior to disclosure, received from a third party, or independently developed.

8. NON-COMPETITION AND NON-SOLICITATION

Non-Compete: {{non_compete}}
{{#if non_compete_duration}}Duration: {{non_compete_duration}} months{{/if}}

Non-Solicitation: {{non_solicitation}}
{{#if non_solicitation_duration}}Duration: {{non_solicitation_duration}} months{{/if}}

If applicable, these restrictions apply during the term and for the specified period after termination.

9. INDEMNIFICATION

9.1. CONTRACTOR INDEMNIFICATION. Contractor shall indemnify, defend, and hold harmless Client and its officers, directors, employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorney fees) arising out of or relating to:
   (a) Contractor's breach of this Agreement;
   (b) Contractor's negligence or willful misconduct;
   (c) Any claim that the work product infringes or violates any intellectual property right or other right of any third party;
   (d) Contractor's violation of any applicable law or regulation;
   (e) Any acts or omissions of Contractor's employees, agents, or subcontractors.

9.2. CLIENT INDEMNIFICATION. Client shall indemnify, defend, and hold harmless Contractor from and against any claims arising out of Client's breach of this Agreement or Client's negligence or willful misconduct.

10. LIABILITY AND DAMAGES

10.1. LIMITATION OF LIABILITY. EXCEPT FOR BREACHES OF CONFIDENTIALITY, INTELLECTUAL PROPERTY INFRINGEMENT, OR GROSS NEGLIGENCE, NEITHER PARTY SHALL BE LIABLE TO THE OTHER FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

10.2. CAP ON LIABILITY. CONTRACTOR'S TOTAL LIABILITY UNDER THIS AGREEMENT SHALL NOT EXCEED THE TOTAL AMOUNT PAID BY CLIENT TO CONTRACTOR IN THE SIX (6) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY.

11. INSURANCE

Insurance Requirements: {{insurance_required}}
{{#if insurance_amount}}Minimum Coverage: USD {{insurance_amount}}{{/if}}

If insurance is required, Contractor shall obtain and maintain coverage at Contractor's own expense and provide Client with certificates of insurance upon request.

12. GENERAL PROVISIONS

12.1. GOVERNING LAW. This Agreement shall be governed by and construed in accordance with the laws of the State of {{governing_state}}, without regard to its conflict of law principles.

12.2. JURISDICTION AND VENUE. Any legal action or proceeding arising under or relating to this Agreement shall be brought exclusively in the state or federal courts located in {{governing_state}}.

12.3. DISPUTE RESOLUTION. [Optional] The Parties agree to first attempt to resolve any disputes through good faith negotiation. If negotiation fails, the Parties may pursue [mediation/arbitration/litigation].

12.4. ENTIRE AGREEMENT. This Agreement constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior and contemporaneous agreements, understandings, negotiations, and discussions, whether oral or written.

12.5. AMENDMENT. This Agreement may not be amended or modified except by a written instrument signed by both Parties.

12.6. WAIVER. No waiver of any provision of this Agreement shall be deemed or shall constitute a waiver of any other provision, nor shall any waiver constitute a continuing waiver.

12.7. SEVERABILITY. If any provision of this Agreement is held to be invalid, illegal, or unenforceable, the validity, legality, and enforceability of the remaining provisions shall not be affected or impaired thereby.

12.8. ASSIGNMENT. Contractor may not assign or delegate any rights or obligations under this Agreement without Client's prior written consent. Client may assign this Agreement to any successor in connection with a merger, acquisition, or sale of substantially all of its assets.

12.9. NOTICES. All notices required or permitted under this Agreement shall be in writing and shall be delivered by email with confirmation of receipt, or by certified mail, return receipt requested, to the addresses set forth above.

12.10. COUNTERPARTS. This Agreement may be executed in counterparts, each of which shall be deemed an original and all of which together shall constitute one and the same instrument. Electronic signatures shall have the same force and effect as original signatures.

12.11. FORCE MAJEURE. Neither Party shall be liable for any delay or failure to perform due to causes beyond its reasonable control, including acts of God, war, terrorism, labor disputes, or governmental actions.

12.12. HEADINGS. Section headings are for convenience only and shall not affect the interpretation of this Agreement.

{{#if additional_terms}}
13. ADDITIONAL TERMS

{{additional_terms}}
{{/if}}

IN WITNESS WHEREOF, the Parties have executed this Independent Contractor Agreement as of the date first written above.

CLIENT:

_________________________________
{{client_name}}

Signature: _______________________

Title (if applicable): ____________

Date: ___________________________


CONTRACTOR:

_________________________________
{{contractor_name}}
{{#if contractor_business_name}}{{contractor_business_name}}{{/if}}

Signature: _______________________

Date: ___________________________


CONTRACTOR'S ACKNOWLEDGMENT

I, {{contractor_name}}, acknowledge and confirm that:

✓ I am an independent contractor and not an employee of {{client_name}}
✓ I am responsible for paying all federal, state, and local taxes
✓ I am not entitled to employee benefits
✓ I control the manner and means of performing my work
✓ I may work for other clients
✓ I will receive IRS Form 1099-NEC (if payments exceed $600/year)
✓ I am responsible for obtaining necessary licenses and insurance
✓ I have read and understood all terms of this Agreement

_________________________________
Contractor's Initials

Date: ___________________________


--------------------------------------------------

IMPORTANT IRS AND LEGAL NOTICE:

INDEPENDENT CONTRACTOR vs. EMPLOYEE CLASSIFICATION:

The IRS and Department of Labor use specific tests to determine whether a worker is an independent contractor or employee. Misclassification can result in significant penalties, back taxes, and legal liability.

KEY FACTORS THE IRS CONSIDERS:

1. BEHAVIORAL CONTROL: Does the company control how the worker does their job?
   ✓ Independent contractors control their own work methods and schedule
   ✗ Employees are told when, where, and how to work

2. FINANCIAL CONTROL: Does the company control business aspects of the worker's job?
   ✓ Independent contractors have unreimbursed expenses, invest in equipment, and can make a profit or loss
   ✗ Employees are reimbursed for expenses and receive guaranteed regular wages

3. RELATIONSHIP: What is the nature of the relationship?
   ✓ Independent contractors have written contracts, no benefits, and work is temporary or project-based
   ✗ Employees receive benefits, have ongoing relationships, and perform core business functions

BEST PRACTICES TO MAINTAIN INDEPENDENT CONTRACTOR STATUS:

• Use written contracts clearly stating independent contractor status
• Pay by project or invoice, not hourly/salary with regular paychecks
• Do not provide equipment, office space, or tools
• Do not set the contractor's work hours or schedule
• Allow contractor to work for other clients
• Do not provide employee benefits
• Issue Form 1099-NEC (not W-2)
• Do not provide training or close supervision
• Use contractors for specialized projects, not ongoing core business functions
• Respect the contractor's independence in how they complete work

CONSULT AN ATTORNEY: This template is provided for informational purposes only and does not constitute legal or tax advice. Employment classification laws vary by state and can be complex. Consult with a licensed attorney and tax professional before using this agreement to ensure compliance with federal and state laws.

--------------------------------------------------


---------------------------------------------------------------------------`
};