// PROFESSIONAL PROMISSORY NOTE TEMPLATE
// Legally binding promise to repay a loan with interest and payment terms
// For personal loans, business loans, and IOU agreements

import { DocumentTemplate } from '../types/document';

export const promissoryNoteTemplate: DocumentTemplate = {
  id: 'promissory-note',
  name: 'Promissory Note',
  description: 'Legally binding written promise to repay a loan with specified interest rate, payment schedule, and terms. Perfect for personal loans between family/friends, small business loans, or formal lending agreements. Includes options for secured/unsecured loans, late fees, and prepayment terms.',
  category: 'Financial & Legal',
  price: 7.00,
  fields: [
    // Loan Amount and Date
    { 
      id: 'loan_amount', 
      label: 'Principal Loan Amount ($)', 
      type: 'currency', 
      required: true,
      helpText: 'The total amount being borrowed (without interest)'
    },
    { 
      id: 'loan_date', 
      label: 'Loan Date', 
      type: 'date', 
      required: true,
      helpText: 'Date the loan is made and money changes hands'
    },
    
    // Borrower Information (Person who RECEIVES money)
    { 
      id: 'borrower_name', 
      label: 'Borrower Full Legal Name', 
      type: 'text', 
      required: true,
      helpText: 'The person RECEIVING the loan (the one who owes money)'
    },
    { 
      id: 'borrower_address', 
      label: 'Borrower Address', 
      type: 'textarea', 
      required: true 
    },
    { 
      id: 'borrower_email', 
      label: 'Borrower Email', 
      type: 'email', 
      required: false 
    },
    { 
      id: 'borrower_phone', 
      label: 'Borrower Phone', 
      type: 'tel', 
      required: false 
    },
    { 
      id: 'borrower_ssn_last4', 
      label: 'Borrower SSN Last 4 Digits (Optional)', 
      type: 'text', 
      required: false,
      helpText: 'For identification purposes only (optional but recommended)'
    },
    
    // Lender Information (Person who GIVES money)
    { 
      id: 'lender_name', 
      label: 'Lender Full Legal Name', 
      type: 'text', 
      required: true,
      helpText: 'The person GIVING the loan (the one who is owed money)'
    },
    { 
      id: 'lender_address', 
      label: 'Lender Address', 
      type: 'textarea', 
      required: true 
    },
    { 
      id: 'lender_email', 
      label: 'Lender Email', 
      type: 'email', 
      required: false 
    },
    { 
      id: 'lender_phone', 
      label: 'Lender Phone', 
      type: 'tel', 
      required: false 
    },
    
    // Interest Rate
    { 
      id: 'interest_rate', 
      label: 'Annual Interest Rate (%)', 
      type: 'text', 
      required: true,
      placeholder: '0',
      helpText: 'Enter 0 for interest-free loan, or the percentage (e.g., 5 for 5% per year)'
    },
    { 
      id: 'interest_type', 
      label: 'Interest Calculation Method', 
      type: 'select',
      options: [
        'Simple Interest',
        'Compound Interest (Monthly)',
        'Compound Interest (Annually)',
        'No Interest (0%)'
      ],
      required: true,
      helpText: 'Simple interest is most common for personal loans'
    },
    
    // Payment Terms
    { 
      id: 'payment_structure', 
      label: 'Payment Structure', 
      type: 'select',
      options: [
        'Lump Sum - Single payment on due date',
        'Monthly Installments - Fixed amount each month',
        'Bi-Weekly Installments',
        'Quarterly Installments',
        'Annual Installments',
        'Interest-Only Payments with Balloon Payment',
        'Custom Payment Schedule'
      ],
      required: true 
    },
    { 
      id: 'installment_amount', 
      label: 'Installment Amount ($) - If Applicable', 
      type: 'currency', 
      required: false,
      helpText: 'Amount of each regular payment (if using installments)'
    },
    { 
      id: 'number_of_payments', 
      label: 'Number of Payments - If Applicable', 
      type: 'text', 
      required: false,
      placeholder: '12',
      helpText: 'Total number of installment payments'
    },
    { 
      id: 'first_payment_date', 
      label: 'First Payment Due Date - If Applicable', 
      type: 'date', 
      required: false,
      helpText: 'Date the first installment payment is due'
    },
    { 
      id: 'payment_day', 
      label: 'Payment Due Day of Month - If Applicable', 
      type: 'select',
      options: [
        '1st of each month', '5th of each month', '10th of each month',
        '15th of each month', '20th of each month', '25th of each month',
        'Last day of each month', 'Other - See custom schedule'
      ],
      required: false,
      helpText: 'For monthly payments'
    },
    { 
      id: 'maturity_date', 
      label: 'Maturity Date (Final Due Date)', 
      type: 'date', 
      required: true,
      helpText: 'Date by which the loan must be fully repaid'
    },
    
    // Payment Method
    { 
      id: 'payment_method', 
      label: 'Accepted Payment Methods', 
      type: 'select',
      options: [
        'Check or Money Order',
        'Bank Transfer / Wire Transfer',
        'ACH / Direct Deposit',
        'Cash',
        'PayPal or Venmo',
        'Zelle or Cash App',
        'Any of the Above'
      ],
      required: true 
    },
    { 
      id: 'payment_address', 
      label: 'Payment Mailing Address (if applicable)', 
      type: 'textarea', 
      required: false,
      helpText: 'Where to send checks or money orders'
    },
    
    // Prepayment Terms
    { 
      id: 'prepayment_allowed', 
      label: 'Prepayment (Early Payoff) Allowed?', 
      type: 'select',
      options: [
        'Yes - No penalty for early payoff',
        'Yes - With prepayment penalty',
        'No - Must follow payment schedule exactly'
      ],
      required: true,
      helpText: 'Can borrower pay off the loan early?'
    },
    { 
      id: 'prepayment_penalty', 
      label: 'Prepayment Penalty (if applicable)', 
      type: 'text', 
      required: false,
      placeholder: 'Example: 2% of remaining principal',
      helpText: 'Fee for paying off loan early'
    },
    
    // Late Payment Terms
    { 
      id: 'late_payment_fee', 
      label: 'Late Payment Fee', 
      type: 'select',
      options: [
        'No late fees',
        'Flat $25 late fee',
        'Flat $50 late fee',
        'Flat $100 late fee',
        '5% of missed payment',
        '10% of missed payment',
        'Custom late fee terms'
      ],
      required: true 
    },
    { 
      id: 'grace_period', 
      label: 'Grace Period Before Late Fee', 
      type: 'select',
      options: [
        'No grace period - Fee applies immediately',
        '5 days grace period',
        '10 days grace period',
        '15 days grace period',
        '30 days grace period'
      ],
      required: true 
    },
    { 
      id: 'default_interest_rate', 
      label: 'Default Interest Rate (%) - If Payment Missed', 
      type: 'text', 
      required: false,
      placeholder: 'Example: 18',
      helpText: 'Higher interest rate that applies if borrower defaults (optional)'
    },
    
    // Security/Collateral
    { 
      id: 'secured_loan', 
      label: 'Is This Loan Secured by Collateral?', 
      type: 'select',
      options: [
        'No - Unsecured loan (no collateral)',
        'Yes - Secured by specific property/asset'
      ],
      required: true,
      helpText: 'Secured loans allow lender to seize collateral if not repaid'
    },
    { 
      id: 'collateral_description', 
      label: 'Collateral Description (if secured)', 
      type: 'textarea', 
      required: false,
      placeholder: 'Example: 2020 Honda Accord, VIN: 1HGCV1F3XLA123456\nOr: Real property located at 123 Main St, City, State',
      helpText: 'Detailed description of property securing the loan'
    },
    { 
      id: 'collateral_value', 
      label: 'Estimated Collateral Value ($) - If Secured', 
      type: 'currency', 
      required: false 
    },
    
    // Acceleration Clause
    { 
      id: 'acceleration_clause', 
      label: 'Include Acceleration Clause?', 
      type: 'select',
      options: [
        'Yes - Full balance due immediately upon default',
        'No - Continue with payment schedule even if one payment missed'
      ],
      required: true,
      helpText: 'Allows lender to demand full payment if borrower defaults'
    },
    
    // Co-Signer/Guarantor
    { 
      id: 'cosigner_required', 
      label: 'Is There a Co-Signer/Guarantor?', 
      type: 'select',
      options: ['No', 'Yes'],
      required: true 
    },
    { 
      id: 'cosigner_name', 
      label: 'Co-Signer Full Legal Name', 
      type: 'text', 
      required: false,
      helpText: 'Person who guarantees payment if borrower defaults'
    },
    { 
      id: 'cosigner_address', 
      label: 'Co-Signer Address', 
      type: 'textarea', 
      required: false 
    },
    { 
      id: 'cosigner_phone', 
      label: 'Co-Signer Phone', 
      type: 'tel', 
      required: false 
    },
    
    // Purpose of Loan
    { 
      id: 'loan_purpose', 
      label: 'Purpose of Loan (Optional)', 
      type: 'select',
      options: [
        'Not Specified',
        'Personal/Family Expenses',
        'Business Expenses',
        'Vehicle Purchase',
        'Home Improvement',
        'Education/Tuition',
        'Debt Consolidation',
        'Medical Expenses',
        'Real Estate Purchase',
        'Other'
      ],
      required: false,
      helpText: 'What the loan will be used for (optional but recommended)'
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
      helpText: 'State law that will govern this promissory note'
    },
    
    // Additional Terms
    { 
      id: 'additional_terms', 
      label: 'Additional Terms or Conditions (Optional)', 
      type: 'textarea', 
      required: false,
      placeholder: 'Any special conditions, restrictions, or additional agreements'
    },
  ],
  
  template: `PROMISSORY NOTE

Principal Amount: USD {{loan_amount}}
Loan Date: {{loan_date}}

FOR VALUE RECEIVED, the undersigned ("Borrower" or "Maker") promises to pay to the order of ("Lender" or "Payee") the principal sum of {{loan_amount}} United States Dollars (USD {{loan_amount}}), together with interest and other charges as set forth below.

--------------------------------------------------

BORROWER (Person Receiving the Loan / Owing the Money):

Name: {{borrower_name}}
Address: {{borrower_address}}
{{#if borrower_email}}Email: {{borrower_email}}{{/if}}
{{#if borrower_phone}}Phone: {{borrower_phone}}{{/if}}
{{#if borrower_ssn_last4}}SSN (Last 4): XXX-XX-{{borrower_ssn_last4}}{{/if}}

(Hereinafter referred to as "Borrower" or "Maker")

--------------------------------------------------

LENDER (Person Giving the Loan / Owed the Money):

Name: {{lender_name}}
Address: {{lender_address}}
{{#if lender_email}}Email: {{lender_email}}{{/if}}
{{#if lender_phone}}Phone: {{lender_phone}}{{/if}}

(Hereinafter referred to as "Lender" or "Payee")

--------------------------------------------------

LOAN TERMS

1. PRINCIPAL AMOUNT
   The principal amount of this loan is: USD {{loan_amount}}

2. LOAN DATE
   This loan is made on: {{loan_date}}

{{#if loan_purpose}}
3. PURPOSE OF LOAN
   The purpose of this loan is: {{loan_purpose}}
   
   This statement of purpose is for informational purposes only and does not limit Borrower's use of the funds or create additional obligations.
{{/if}}

--------------------------------------------------

INTEREST

4. INTEREST RATE
   Annual Interest Rate: {{interest_rate}}%
   Interest Calculation Method: {{interest_type}}

{{#if interest_rate}}
   Interest shall accrue from the Loan Date until the principal and all accrued interest are paid in full. Interest shall be calculated using the {{interest_type}} method.
   
   {{#if interest_type}}
   {{#if interest_type "Simple Interest"}}
   Simple Interest Formula: Interest = Principal × Rate × Time
   Example: For a USD 10,000 loan at 5% for 1 year = USD 500 in interest
   {{/if}}
   {{/if}}
{{else}}
   NO INTEREST: This is an interest-free loan. No interest will accrue on the principal balance.
{{/if}}

--------------------------------------------------

PAYMENT TERMS

5. PAYMENT STRUCTURE
   {{payment_structure}}

{{#if installment_amount}}
6. INSTALLMENT PAYMENTS
   Installment Amount: USD {{installment_amount}}
   {{#if number_of_payments}}Number of Payments: {{number_of_payments}}{{/if}}
   {{#if first_payment_date}}First Payment Due: {{first_payment_date}}{{/if}}
   {{#if payment_day}}Payment Due: {{payment_day}}{{/if}}
   
   Borrower shall make regular installment payments of USD {{installment_amount}} each, continuing until the entire principal balance and all accrued interest are paid in full.
{{/if}}

7. MATURITY DATE (FINAL DUE DATE)
   The entire outstanding principal balance and all accrued interest shall be due and payable in full on or before: {{maturity_date}}
   
   This is the absolute final date by which the loan must be completely repaid. If any balance remains unpaid after this date, Borrower shall be in default.

8. PAYMENT METHOD
   Payments shall be made by: {{payment_method}}
   
{{#if payment_address}}
   Payment Mailing Address:
   {{payment_address}}
{{/if}}
   
   All payments shall be in United States currency. Payments shall be applied first to any accrued interest, late fees, and other charges, with the remainder applied to principal.

--------------------------------------------------

PREPAYMENT

9. PREPAYMENT RIGHTS
   {{prepayment_allowed}}
   
{{#if prepayment_allowed}}
   {{#if prepayment_penalty}}
   Prepayment Penalty: {{prepayment_penalty}}
   
   If Borrower chooses to pay off the loan before the Maturity Date, Borrower shall pay the prepayment penalty specified above in addition to the outstanding principal and accrued interest.
   {{else}}
   Borrower may prepay all or any portion of the principal balance at any time without penalty. Prepayments shall be applied to principal and shall reduce future interest charges accordingly.
   {{/if}}
{{else}}
   Borrower may NOT prepay this loan. All payments must be made according to the payment schedule. Early payments will not reduce the total interest owed.
{{/if}}

--------------------------------------------------

LATE PAYMENTS AND DEFAULT

10. LATE PAYMENT FEE
    {{late_payment_fee}}
    
    Grace Period: {{grace_period}}
    
    If any payment is not received within the grace period after the due date, Borrower shall pay the late fee specified above in addition to the regular payment amount.

{{#if default_interest_rate}}
11. DEFAULT INTEREST RATE
    If Borrower is in default under this Note, the interest rate shall increase to {{default_interest_rate}}% per annum (the "Default Rate") on the entire outstanding balance until the default is cured.
    
    The Default Rate shall apply from the date of default until Borrower is no longer in default.
{{/if}}

12. DEFAULT
    Borrower shall be in default under this Promissory Note if any of the following occur:
    
    (a) Borrower fails to make any payment when due and does not cure the missed payment within thirty (30) days after receiving written notice from Lender;
    
    (b) Borrower fails to pay the entire outstanding balance by the Maturity Date;
    
    (c) Borrower becomes insolvent, files for bankruptcy, or makes an assignment for the benefit of creditors;
    
    (d) Borrower dies or becomes legally incapacitated (unless a co-signer or guarantor has agreed to assume the obligation);
    
    {{#if secured_loan}}
    (e) Borrower sells, transfers, or encumbers the collateral securing this Note without Lender's prior written consent;
    
    (f) The collateral is destroyed, damaged, or significantly decreases in value;
    {{/if}}
    
    (g) Any representation or warranty made by Borrower in connection with this Note proves to have been false or misleading when made.

13. ACCELERATION CLAUSE
    {{acceleration_clause}}
    
{{#if acceleration_clause}}
    Upon default, Lender may, at Lender's option, declare the entire unpaid principal balance, together with all accrued interest and other charges, immediately due and payable without further notice or demand.
    
    This means if Borrower misses even one payment and fails to cure within the notice period, Lender can demand immediate payment of the ENTIRE remaining loan balance, not just the missed payment.
{{else}}
    Even if Borrower misses a payment, Lender may not accelerate the loan. Borrower shall continue making payments according to the original schedule, plus any applicable late fees and default interest.
{{/if}}

14. REMEDIES UPON DEFAULT
    If Borrower defaults under this Note, Lender shall have the following remedies:
    
    (a) Demand immediate payment of all amounts owed (if acceleration clause applies);
    
    (b) Charge the Default Interest Rate (if applicable);
    
    (c) Assess late fees and other charges as provided in this Note;
    
    (d) Report the default to credit bureaus, which may negatively affect Borrower's credit score;
    
    {{#if secured_loan}}
    (e) Take possession of and sell the collateral to satisfy the debt;
    {{/if}}
    
    (f) Pursue legal action to collect the debt, including filing a lawsuit;
    
    (g) Seek a judgment against Borrower for the full amount owed plus interest, costs, and reasonable attorney fees;
    
    (h) Garnish Borrower's wages or bank accounts (if permitted by law);
    
    (i) Exercise any other rights available under applicable law.

--------------------------------------------------

SECURITY / COLLATERAL

15. SECURITY INTEREST
    {{secured_loan}}

{{#if collateral_description}}
    This Promissory Note is SECURED by the following collateral:
    
    {{collateral_description}}
    
    {{#if collateral_value}}Estimated Value: USD {{collateral_value}}{{/if}}
    
    SECURITY AGREEMENT: By signing this Note, Borrower grants to Lender a security interest in the collateral described above. Borrower represents and warrants that:
    
    (a) Borrower is the legal owner of the collateral and has full right to pledge it as security;
    (b) The collateral is free from any other liens or encumbrances (unless disclosed to Lender);
    (c) Borrower will maintain the collateral in good condition;
    (d) Borrower will keep the collateral adequately insured;
    (e) Borrower will not sell, transfer, or further encumber the collateral without Lender's prior written consent.
    
    LENDER'S RIGHTS UPON DEFAULT: If Borrower defaults, Lender may take possession of the collateral and sell it at public or private sale. Lender may apply the proceeds of sale to the outstanding debt. If the sale proceeds exceed the debt, Lender will pay the surplus to Borrower. If the proceeds are insufficient, Borrower remains liable for the deficiency.
    
    PERFECTION OF SECURITY INTEREST: The Parties acknowledge that this Promissory Note may need to be supplemented with additional documents (such as a UCC-1 financing statement for personal property or a mortgage/deed of trust for real property) to properly perfect Lender's security interest under applicable law.
{{else}}
    This Promissory Note is UNSECURED. Borrower has not pledged any collateral to secure repayment. If Borrower defaults, Lender's remedies are limited to legal action for collection and judgment.
{{/if}}

--------------------------------------------------

CO-SIGNER / GUARANTOR

16. CO-SIGNER
    Co-Signer/Guarantor: {{cosigner_required}}

{{#if cosigner_name}}
    CO-SIGNER INFORMATION:
    Name: {{cosigner_name}}
    Address: {{cosigner_address}}
    {{#if cosigner_phone}}Phone: {{cosigner_phone}}{{/if}}
    
    GUARANTY: The undersigned Co-Signer/Guarantor ("Co-Signer") unconditionally guarantees the full and timely payment of all amounts owed under this Promissory Note. Co-Signer agrees to be jointly and severally liable with Borrower for all obligations under this Note.
    
    This means:
    - Lender can demand payment from Co-Signer without first trying to collect from Borrower
    - Co-Signer is equally responsible for the entire debt
    - Co-Signer's credit may be affected if Borrower defaults
    - Co-Signer waives any defenses based on Borrower's incapacity, bankruptcy, or other defenses
    
    Co-Signer remains liable even if:
    - Lender grants extensions or modifications to Borrower
    - Lender releases or impairs any collateral
    - Lender delays in enforcing rights against Borrower
{{/if}}

--------------------------------------------------

GENERAL PROVISIONS

17. GOVERNING LAW
    This Promissory Note shall be governed by and construed in accordance with the laws of the State of {{governing_state}}, without regard to its conflict of law principles.

18. JURISDICTION AND VENUE
    Any legal action to enforce this Note shall be brought in the state or federal courts located in {{governing_state}}. Borrower consents to the jurisdiction of such courts and waives any objection to venue.

19. ATTORNEYS' FEES AND COSTS
    If Lender is required to take legal action to collect amounts owed under this Note, Borrower shall pay all costs of collection, including reasonable attorney fees, court costs, collection agency fees, and other expenses incurred by Lender.

20. WAIVER
    No delay or omission by Lender in exercising any right under this Note shall constitute a waiver of that right or any other right. A waiver on one occasion shall not constitute a waiver on any future occasion.

21. SEVERABILITY
    If any provision of this Note is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.

22. AMENDMENTS
    This Note may not be amended, modified, or supplemented except by a written agreement signed by both Borrower and Lender.

23. NOTICES
    All notices required under this Note shall be in writing and delivered to the addresses set forth above (or such other addresses as a party may designate in writing). Notices may be delivered by:
    (a) Personal delivery;
    (b) Certified mail, return receipt requested;
    (c) Overnight courier service;
    (d) Email (with confirmation of receipt).

24. ENTIRE AGREEMENT
    This Promissory Note constitutes the entire agreement between Borrower and Lender regarding this loan and supersedes all prior discussions, negotiations, and agreements.

25. SUCCESSORS AND ASSIGNS
    This Note shall be binding upon Borrower and Borrower's heirs, executors, administrators, and legal representatives. This Note shall benefit Lender and Lender's successors and assigns.
    
    Lender may sell, transfer, or assign this Note and any security interest without Borrower's consent. Borrower may NOT transfer or assign any obligations under this Note without Lender's prior written consent.

26. JOINT AND SEVERAL LIABILITY
    If more than one person signs this Note as Borrower, each such person shall be jointly and severally liable for the full amount of the debt. This means Lender can collect the entire amount from any one Borrower.

27. USURY SAVINGS CLAUSE
    It is the intention of the parties to comply with all applicable usury laws. If any provision of this Note would result in a rate of interest that exceeds the maximum rate permitted by law, the interest rate shall automatically be reduced to the maximum legal rate. Any amount collected in excess of the legal maximum shall be refunded to Borrower or credited against the principal balance.

28. NO ORAL MODIFICATIONS
    This is a written contract. Any oral statements, promises, or representations not contained in this written Note are not binding. This Note can only be modified by a written document signed by both parties.

29. COUNTERPARTS
    This Note may be executed in counterparts, each of which shall be deemed an original and all of which together shall constitute one and the same instrument. Electronic signatures shall have the same effect as original signatures.

30. WAIVER OF JURY TRIAL
    TO THE EXTENT PERMITTED BY LAW, BORROWER AND LENDER EACH WAIVE THEIR RIGHT TO A JURY TRIAL IN ANY LAWSUIT, PROCEEDING, OR COUNTERCLAIM BROUGHT BY EITHER PARTY AGAINST THE OTHER ARISING OUT OF OR IN CONNECTION WITH THIS NOTE.

{{#if additional_terms}}
31. ADDITIONAL TERMS AND CONDITIONS

{{additional_terms}}
{{/if}}

--------------------------------------------------

ACKNOWLEDGMENT AND PROMISE TO PAY

I, the undersigned Borrower, acknowledge that I have read this Promissory Note in its entirety, understand all of its terms and conditions, and agree to be legally bound by them.

I PROMISE TO PAY the Lender the principal sum of USD {{loan_amount}}, plus interest and other charges as set forth above, according to the terms of this Note.

I understand that:
- This is a legally binding obligation
- Failure to repay can result in legal action, wage garnishment, and damage to my credit
- I am personally liable for the entire debt
{{#if secured_loan}}- The collateral may be seized and sold if I default{{/if}}
{{#if cosigner_name}}- My co-signer is equally responsible for this debt{{/if}}

--------------------------------------------------

SIGNATURES

BORROWER (Maker):

_____________________________________
{{borrower_name}}

Signature: ___________________________

Date: _______________________________

{{#if borrower_ssn_last4}}
SSN (Last 4): XXX-XX-{{borrower_ssn_last4}}
{{/if}}


{{#if cosigner_name}}
CO-SIGNER / GUARANTOR:

_____________________________________
{{cosigner_name}}

Signature: ___________________________

Date: _______________________________


By signing above, Co-Signer unconditionally guarantees payment of all amounts owed under this Promissory Note and agrees to be jointly and severally liable with Borrower.
{{/if}}


LENDER (Payee):

_____________________________________
{{lender_name}}

Signature: ___________________________

Date: _______________________________


--------------------------------------------------

NOTARY ACKNOWLEDGMENT (OPTIONAL BUT RECOMMENDED)

State of {{governing_state}}
County of ___________________

On this _____ day of _____________, 20_____, before me, a Notary Public, personally appeared {{borrower_name}}, known to me (or satisfactorily proven) to be the person whose name is subscribed to the within instrument, and acknowledged that he/she executed the same for the purposes therein contained.

IN WITNESS WHEREOF, I hereunto set my hand and official seal.

_____________________________________
Notary Public Signature

My Commission Expires: ______________

[NOTARY SEAL]


--------------------------------------------------

LEGAL DISCLAIMER AND IMPORTANT INFORMATION

This Promissory Note template is provided for informational purposes only and does not constitute legal or financial advice.

WHEN TO CONSULT AN ATTORNEY OR FINANCIAL ADVISOR:

You should consult with a licensed attorney if:
- The loan amount exceeds $10,000
- The loan involves real estate or requires a mortgage/deed of trust
- The loan is secured by valuable collateral (vehicle, equipment, etc.)
- You need to perfect a security interest (UCC filing, vehicle title lien, etc.)
- The borrower is a business entity (corporation, LLC, partnership)
- The loan involves complex payment terms or balloon payments
- You are lending across state lines
- You have questions about usury laws (maximum interest rates)
- You anticipate potential collection issues or defaults

IMPORTANT NOTES ABOUT PROMISSORY NOTES:

1. USURY LAWS: Each state has maximum interest rates (usury limits). Charging interest above the legal maximum can void the interest or even the entire loan. Check your state's usury laws.

2. TAX IMPLICATIONS:
   - For Lenders: Interest income is taxable and must be reported to the IRS
   - For Borrowers: Interest on personal loans is generally NOT tax deductible (business loans may be)
   - Imputed Interest: If you make an interest-free loan over $10,000, the IRS may impute interest income
   - Consult a tax professional for loans over $10,000

3. STATUTE OF FRAUDS: Most states require loans over a certain amount to be in writing. Always use a written promissory note for any significant loan.

4. SECURED VS. UNSECURED:
   - SECURED: Lender can seize collateral if borrower defaults (requires proper documentation)
   - UNSECURED: Lender can only sue for payment (no automatic right to seize property)

5. PERFECTING SECURITY INTERESTS:
   - Vehicle: Must file lien with DMV and note on title
   - Personal Property: File UCC-1 financing statement with Secretary of State
   - Real Estate: Must record mortgage or deed of trust with county recorder
   - Without proper perfection, your security interest may be invalid

6. COLLECTION:
   - If borrower defaults, you may need to sue and obtain a judgment
   - Judgments can be used to garnish wages or bank accounts
   - Collection through courts can be time-consuming and expensive
   - Consider using a collection attorney if the amount is substantial

7. FAMILY/FRIEND LOANS:
   - Even with family or friends, ALWAYS use a written promissory note
   - Be clear about terms to avoid misunderstandings
   - Understand that legal action may damage the relationship
   - Consider whether you can afford to lose the money if not repaid

8. CREDIT REPORTING:
   - Most personal lenders cannot report to credit bureaus (only institutional lenders can)
   - However, if you obtain a judgment, that will appear on the borrower's credit report

ALTERNATIVES TO PROMISSORY NOTES:

- SIMPLE IOU: For very small loans between family/friends (under $1,000)
- LOAN AGREEMENT: More comprehensive contract with detailed terms
- LINE OF CREDIT AGREEMENT: For ongoing borrowing relationship
- BUSINESS LOAN AGREEMENT: For loans to businesses

STATE-SPECIFIC CONSIDERATIONS:

- Maximum interest rates vary by state (typically 6%-36%)
- Some states require notarization for certain secured loans
- Statute of limitations on debt collection varies (typically 3-6 years)
- Some states prohibit certain prepayment penalties
- Check your state's specific requirements

--------------------------------------------------

This Promissory Note was generated on {{current_month}} {{current_day}}, {{current_year}}.

BOTH PARTIES SHOULD RETAIN A SIGNED COPY FOR THEIR RECORDS.
LENDER SHOULD KEEP THE ORIGINAL SIGNED NOTE IN A SAFE PLACE.`
};
