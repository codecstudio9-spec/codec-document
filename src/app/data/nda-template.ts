// PROFESSIONAL NON-DISCLOSURE AGREEMENT (NDA) TEMPLATE
// Comprehensive confidentiality agreement suitable for business, employment, and contractor relationships

import { DocumentTemplate } from '../types/document';

export const ndaTemplate: DocumentTemplate = {
  id: 'nda',
  name: 'Non-Disclosure Agreement (NDA)',
  description: 'Professional confidentiality agreement to protect sensitive business information, trade secrets, and proprietary data. Suitable for employees, contractors, partners, and business relationships.',
  category: 'Business & Contracts',
  price: 9.99,
  fields: [
    // Agreement Type
    { 
      id: 'agreement_type', 
      label: 'Type of NDA', 
      type: 'select', 
      options: [
        'Unilateral (One-Way) - Only one party shares confidential information',
        'Mutual (Two-Way) - Both parties share confidential information'
      ], 
      required: true,
      helpText: 'Unilateral: Only you share info with them. Mutual: Both parties share info with each other.'
    },
    
    // Disclosing Party Information (The one sharing confidential info)
    { 
      id: 'disclosing_party_name', 
      label: 'Disclosing Party Full Legal Name', 
      type: 'text', 
      required: true,
      helpText: 'The person or company SHARING confidential information' 
    },
    { 
      id: 'disclosing_party_address', 
      label: 'Disclosing Party Address', 
      type: 'textarea', 
      required: true 
    },
    { 
      id: 'disclosing_party_email', 
      label: 'Disclosing Party Email', 
      type: 'email', 
      required: false 
    },
    { 
      id: 'disclosing_party_type', 
      label: 'Disclosing Party Type', 
      type: 'select', 
      options: ['Individual', 'Corporation', 'LLC', 'Partnership', 'Other Business Entity'], 
      required: true 
    },
    
    // Receiving Party Information (The one receiving confidential info)
    { 
      id: 'receiving_party_name', 
      label: 'Receiving Party Full Legal Name', 
      type: 'text', 
      required: true,
      helpText: 'The person or company RECEIVING confidential information'
    },
    { 
      id: 'receiving_party_address', 
      label: 'Receiving Party Address', 
      type: 'textarea', 
      required: true 
    },
    { 
      id: 'receiving_party_email', 
      label: 'Receiving Party Email', 
      type: 'email', 
      required: false 
    },
    { 
      id: 'receiving_party_type', 
      label: 'Receiving Party Type', 
      type: 'select', 
      options: ['Individual', 'Corporation', 'LLC', 'Partnership', 'Other Business Entity'], 
      required: true 
    },
    
    // Purpose of Disclosure
    { 
      id: 'disclosure_purpose', 
      label: 'Purpose of Disclosure', 
      type: 'textarea', 
      required: true,
      placeholder: 'Example: Evaluating a potential business partnership, discussing a joint venture, employment relationship, contractor services, etc.',
      helpText: 'Describe why confidential information is being shared'
    },
    
    // Term of Agreement
    { 
      id: 'term_type', 
      label: 'Term of Confidentiality Obligation', 
      type: 'select', 
      options: [
        '1 Year from Effective Date',
        '2 Years from Effective Date',
        '3 Years from Effective Date',
        '5 Years from Effective Date',
        'Indefinite (Until information becomes public)',
        'Custom Duration'
      ], 
      required: true,
      helpText: 'How long must the receiving party keep information confidential?'
    },
    { 
      id: 'custom_term_years', 
      label: 'Custom Duration (Years) - If "Custom Duration" selected', 
      type: 'number', 
      required: false,
      placeholder: '3'
    },
    
    // Types of Confidential Information
    { 
      id: 'confidential_info_types', 
      label: 'Types of Confidential Information (check all that apply)', 
      type: 'textarea', 
      required: true,
      placeholder: 'Example: Trade secrets, business plans, financial data, customer lists, proprietary software, marketing strategies, technical specifications, product designs, etc.',
      helpText: 'Be specific about what information is considered confidential'
    },
    
    // Return of Materials
    { 
      id: 'return_materials', 
      label: 'Return of Materials Upon Termination?', 
      type: 'select', 
      options: [
        'Yes - All materials must be returned or destroyed',
        'No - Materials may be retained confidentially'
      ], 
      required: true 
    },
    
    // Non-Compete (Optional)
    { 
      id: 'non_compete', 
      label: 'Include Non-Compete Clause?', 
      type: 'select', 
      options: ['No', 'Yes'], 
      required: true,
      helpText: 'Restricts receiving party from competing in the same business during the term'
    },
    { 
      id: 'non_compete_duration', 
      label: 'Non-Compete Duration (Months) - If Yes', 
      type: 'number', 
      required: false,
      placeholder: '12'
    },
    { 
      id: 'non_compete_territory', 
      label: 'Non-Compete Territory - If Yes', 
      type: 'text', 
      required: false,
      placeholder: 'United States, California, 50-mile radius, etc.'
    },
    
    // Non-Solicitation (Optional)
    { 
      id: 'non_solicitation', 
      label: 'Include Non-Solicitation Clause?', 
      type: 'select', 
      options: ['No', 'Yes'], 
      required: true,
      helpText: 'Prevents receiving party from hiring employees or soliciting customers'
    },
    { 
      id: 'non_solicitation_duration', 
      label: 'Non-Solicitation Duration (Months) - If Yes', 
      type: 'number', 
      required: false,
      placeholder: '12'
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
      required: true,
      helpText: 'Which state laws will govern this agreement?'
    },
    
    // Injunctive Relief
    { 
      id: 'injunctive_relief', 
      label: 'Injunctive Relief Clause?', 
      type: 'select', 
      options: [
        'Yes - Breach may be remedied by injunction without posting bond',
        'No'
      ], 
      required: true,
      helpText: 'Allows immediate court action to stop breaches without delay'
    },
    
    // Attorney Fees
    { 
      id: 'attorney_fees', 
      label: 'Prevailing Party Attorney Fees?', 
      type: 'select', 
      options: [
        'Yes - Prevailing party in litigation recovers attorney fees',
        'No - Each party pays own attorney fees'
      ], 
      required: true 
    },
    
    // Additional Provisions
    { 
      id: 'additional_provisions', 
      label: 'Additional Provisions (Optional)', 
      type: 'textarea', 
      required: false,
      placeholder: 'Any additional terms or special conditions for this NDA'
    },
  ],
  
  template: `MUTUAL / UNILATERAL NON-DISCLOSURE AGREEMENT

Effective Date: {{current_month}} {{current_day}}, {{current_year}}

This Non-Disclosure Agreement ("Agreement") is entered into by and between:

DISCLOSING PARTY:
{{disclosing_party_name}}
{{disclosing_party_address}}
{{#if disclosing_party_email}}Email: {{disclosing_party_email}}{{/if}}
Type: {{disclosing_party_type}}
("Disclosing Party")

and

RECEIVING PARTY:
{{receiving_party_name}}
{{receiving_party_address}}
{{#if receiving_party_email}}Email: {{receiving_party_email}}{{/if}}
Type: {{receiving_party_type}}
("Receiving Party")

{{#if is_mutual}}
(Each may be referred to as a "Party" and together as the "Parties". This is intended as a mutual NDA.)
{{else}}
(Each may be referred to as a "Party" and together as the "Parties". This is intended as a unilateral NDA.)
{{/if}}

1. PURPOSE

The Parties wish to explore and/or engage in the following business purpose:
{{disclosure_purpose}} (the "Purpose").

2. DEFINITION OF CONFIDENTIAL INFORMATION

2.1. "Confidential Information" means any non-public, proprietary, technical, financial, commercial, legal, strategic, or operational information disclosed by the Disclosing Party to the Receiving Party, in any form, including but not limited to:

   {{confidential_info_types}}

2.2. Confidential Information includes, without limitation:
   (a) Trade secrets, know-how, inventions, techniques, processes, and algorithms;
   (b) Business plans, strategies, forecasts, and financial information;
   (c) Customer and supplier lists, contact information, and relationship details;
   (d) Pricing information, cost data, and profit margins;
   (e) Marketing plans, sales strategies, and market research;
   (f) Software, source code, object code, and technical specifications;
   (g) Product designs, prototypes, and development plans;
   (h) Personnel information and organizational structures;
   (i) Any other information marked or identified as "Confidential," "Proprietary," or with a similar designation;
   (j) Any information that a reasonable person would understand to be confidential given the nature of the information and circumstances of disclosure.

2.3. Confidential Information does not include information that:
   (a) Is or becomes publicly available through no breach of this Agreement by the Receiving Party;
   (b) Was rightfully in the Receiving Party's possession prior to disclosure by the Disclosing Party, as evidenced by written records;
   (c) Is rightfully received by the Receiving Party from a third party without breach of any confidentiality obligation;
   (d) Is independently developed by the Receiving Party without use of or reference to the Confidential Information, as evidenced by written records;
   (e) Is required to be disclosed by law, regulation, or court order, provided that the Receiving Party provides prompt written notice to the Disclosing Party and cooperates in any effort to seek a protective order or otherwise limit such disclosure.

3. OBLIGATIONS OF RECEIVING PARTY

3.1. The Receiving Party agrees to:
   (a) Hold and maintain all Confidential Information in strict confidence;
   (b) Use the Confidential Information solely for the purpose stated in this Agreement: {{disclosure_purpose}};
   (c) Not disclose, publish, or disseminate any Confidential Information to any third party without the prior written consent of the Disclosing Party;
   (d) Protect the Confidential Information using the same degree of care it uses to protect its own confidential information, but in no event less than reasonable care;
   (e) Limit access to employees, officers, directors, attorneys, accountants, consultants, contractors, affiliates, or advisors with a legitimate need to know and bound by confidentiality obligations at least as protective as this Agreement.

3.2. The Receiving Party is responsible for breaches by its employees, contractors, agents, and representatives.

3.3. The Receiving Party shall not copy, reverse engineer, decompile, disassemble, or exploit Confidential Information except as expressly authorized in writing.

4. LEGALLY REQUIRED DISCLOSURE

If legally required to disclose Confidential Information, the Receiving Party shall, to the extent permitted by law: (a) promptly notify the Disclosing Party, (b) cooperate to seek protective treatment, and (c) disclose only the minimum portion legally required.

5. TERM, OWNERSHIP, AND RETURN OF MATERIALS

5.1. All Confidential Information remains the sole and exclusive property of the Disclosing Party. No license, ownership transfer, assignment, or other rights are granted by this Agreement.

{{#if return_materials_yes}}
5.2. Upon written request of the Disclosing Party, the Receiving Party shall:
   (a) Promptly return to the Disclosing Party all documents, materials, and other tangible items containing or representing Confidential Information;
   (b) Permanently delete or destroy all electronic copies of Confidential Information in its possession or control;
   (c) Certify in writing to the Disclosing Party that it has complied with the requirements of this Section within thirty (30) days of such request or termination.
{{/if}}

5.3. This Agreement shall remain in effect for:

   {{term_description}}

5.4. Confidentiality obligations survive termination or expiration as follows:
   (a) trade secrets: as long as permitted by applicable law;
   (b) all other Confidential Information: for the period above or as required by applicable law, whichever is longer.

6. INTELLECTUAL PROPERTY

Nothing in this Agreement grants any rights in patents, trademarks, copyrights, trade secrets, software, inventions, or other intellectual property.

{{#if non_compete_yes}}
7. NON-COMPETE (OPTIONAL)

For {{non_compete_duration}} months following termination, Receiving Party shall not directly compete within: {{non_compete_territory}}, to the extent enforceable under applicable law.
{{/if}}

{{#if non_solicitation_yes}}
8. NON-SOLICITATION (OPTIONAL)

For {{non_solicitation_duration}} months following termination, Receiving Party shall not knowingly solicit for employment or engagement personnel of the Disclosing Party known through the Purpose, to the extent enforceable under applicable law.
{{/if}}

9. DISCLAIMER OF WARRANTIES

All Confidential Information is provided "AS IS," without warranties of any kind, express or implied, including accuracy, completeness, merchantability, fitness for a particular purpose, or non-infringement.

10. REMEDIES

10.1. The Receiving Party acknowledges and agrees that:
   (a) The Confidential Information is valuable and unique, and that disclosure in breach of this Agreement will result in irreparable injury to the Disclosing Party;
   (b) Monetary damages would be an inadequate remedy for any breach of this Agreement;
   (c) The Disclosing Party shall be entitled to seek equitable relief, including injunction and specific performance, in the event of any breach or threatened breach of this Agreement;
   (d) Such remedies shall be in addition to all other remedies available at law or in equity.

{{#if injunctive_relief_yes}}
10.2. The Disclosing Party may seek injunctive relief without posting bond, to the extent permitted by law.
{{/if}}

11. GOVERNING LAW AND JURISDICTION

11.1. This Agreement is governed by the laws of the State of {{governing_state}}, excluding conflict-of-law principles.

11.2. Any dispute arising from this Agreement shall be resolved exclusively in competent state or federal courts located in {{governing_state}}.

12. GENERAL PROVISIONS

12.1. Entire Agreement. This Agreement supersedes all prior discussions and agreements on this subject matter.

12.2. Amendments. Any amendment must be in writing and signed by both Parties.

12.3. Waiver. No waiver is valid unless in writing.

12.4. Severability. If any provision is unenforceable, the remaining provisions remain effective.

12.5. Assignment. No assignment without prior written consent, except in merger, acquisition, or sale of substantially all assets.

12.6. No Partnership. Nothing in this Agreement creates a partnership, joint venture, agency, employment, or fiduciary relationship.

12.7. Counterparts and E-Signatures. This Agreement may be executed in counterparts and via electronic signatures, each deemed valid and enforceable.

12.8. Notices. Notices must be in writing and sent to the addresses of the Parties unless updated in writing.

{{#if attorney_fees_yes}}
12.9. Attorneys' Fees. The prevailing party may recover reasonable attorneys' fees and costs, to the extent permitted by law.
{{/if}}

{{#if additional_provisions}}
13. ADDITIONAL PROVISIONS

{{additional_provisions}}
{{/if}}

IN WITNESS WHEREOF, the Parties execute this Agreement as of the Effective Date.

DISCLOSING PARTY

_________________________________
{{disclosing_party_name}}

Signature: _______________________________

Name / Title: ____________________________

Date: ___________________________________


RECEIVING PARTY

_________________________________
{{receiving_party_name}}

Signature: _______________________________

Name / Title: ____________________________

Date: ___________________________________


IMPORTANT LEGAL NOTICE:

This Non-Disclosure Agreement is a legally binding contract. Before signing:
1. Read all provisions carefully
2. Consult with an attorney licensed in your state
3. Ensure you understand your obligations and restrictions
4. Verify that all information is accurate and complete


---------------------------------------------------------------------------`
};
