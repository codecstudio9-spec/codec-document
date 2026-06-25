import { DocumentTemplate } from '../types/document';
import { residentialLeaseTemplate } from './residential-lease-template';
import { ndaTemplate } from './nda-template';
import { independentContractorTemplate } from './independent-contractor-template';
import { billOfSaleVehicleTemplate } from './bill-of-sale-vehicle-template';
import { serviceAgreementTemplate } from './service-agreement-template';
import { promissoryNoteTemplate } from './promissory-note-template';

export const documentTemplates: DocumentTemplate[] = [
  // Real documents available
  residentialLeaseTemplate,
  ndaTemplate,
  independentContractorTemplate,
  billOfSaleVehicleTemplate,
  serviceAgreementTemplate,
  promissoryNoteTemplate,
  
  // Estate Planning & Personal
  {
    id: 'last-will-testament',
    name: 'Last Will and Testament',
    description: 'Comprehensive will to distribute assets, name guardians for children, and appoint an executor.',
    category: 'Estate Planning & Personal',
    price: 8,
    fields: [
      { id: 'testator_name', label: 'Your Full Legal Name', type: 'text', required: true },
      { id: 'testator_address', label: 'Your Address', type: 'textarea', required: true },
      { id: 'testator_dob', label: 'Your Date of Birth', type: 'date', required: true },
      { id: 'testator_county', label: 'County', type: 'text', required: true },
      { id: 'executor_name', label: 'Executor Name', type: 'text', required: true, helpText: 'Person who will manage your estate' },
      { id: 'executor_address', label: 'Executor Address', type: 'textarea', required: true },
      { id: 'executor_relation', label: 'Executor Relationship', type: 'text', required: true },
      { id: 'alternate_executor', label: 'Alternate Executor Name', type: 'text', required: false },
      { id: 'beneficiary1_name', label: 'Primary Beneficiary Name', type: 'text', required: true },
      { id: 'beneficiary1_relation', label: 'Relationship', type: 'text', required: true, placeholder: 'Spouse, Child, etc.' },
      { id: 'beneficiary1_share', label: 'Share (%)', type: 'number', required: true, placeholder: '100' },
      { id: 'guardian_name', label: 'Guardian for Minor Children (if applicable)', type: 'text', required: false },
      { id: 'guardian_address', label: 'Guardian Address', type: 'textarea', required: false },
      { id: 'state', label: 'Your State', type: 'text', required: true },
    ],
    template: `LAST WILL AND TESTAMENT

I, {{testator_name}}, currently residing at {{testator_address}}, in the County of {{testator_county}}, State of {{state}}, being of sound mind and disposing memory, and not acting under duress, fraud, or undue influence of any person, do hereby make, publish, and declare this to be my Last Will and Testament, hereby expressly revoking all prior wills and codicils heretofore made by me.

ARTICLE I - DECLARATION AND IDENTIFICATION

1.1 IDENTITY. I declare that I am {{testator_name}}, born on {{testator_dob}}. I am a legal resident of the State of {{state}}.

1.2 FAMILY STATUS. I declare my current family status and relationships for purposes of this Will. This Will makes specific provisions for all persons who are my legal heirs.

1.3 REVOCATION. I hereby revoke all prior wills, codicils, and testamentary dispositions made by me.

ARTICLE II - PAYMENT OF DEBTS, EXPENSES, AND TAXES

2.1 DEBTS AND EXPENSES. I direct my Executor to pay all of my legally enforceable debts, funeral expenses, and costs of administering my estate as soon as practicable after my death.

2.2 TAXES. I direct that all estate, inheritance, succession, and other death taxes (including interest and penalties thereon) payable by reason of my death shall be paid out of my residuary estate without apportionment and without reimbursement from any recipient of my property.

ARTICLE III - APPOINTMENT OF EXECUTOR

3.1 EXECUTOR. I hereby nominate, constitute, and appoint {{executor_name}}, currently residing at {{executor_address}}, my {{executor_relation}}, to serve as the Executor of this Last Will and Testament.

3.2 ALTERNATE EXECUTOR. If {{executor_name}} is unable or unwilling to serve, or having commenced to serve, ceases to serve as Executor for any reason, then I nominate and appoint {{alternate_executor}} to serve as successor Executor.

3.3 NO BOND REQUIRED. I direct that no Executor named herein shall be required to post bond or other security in any jurisdiction, any provision of law to the contrary notwithstanding.

3.4 POWERS OF EXECUTOR. I grant to my Executor full power and authority to administer and settle my estate, and to perform all acts necessary or appropriate for the proper administration thereof, including but not limited to the following powers:

   (a) To retain any property belonging to my estate for such time as my Executor deems advisable;
   (b) To sell, exchange, lease, mortgage, pledge, or otherwise dispose of any property, real or personal;
   (c) To invest and reinvest estate assets in any kind of property, real or personal;
   (d) To settle, compromise, or submit to arbitration any claims or debts;
   (e) To borrow money and encumber estate property by mortgage or pledge;
   (f) To continue, operate, or participate in any business;
   (g) To make distributions in cash or in kind, or partly in each;
   (h) To employ attorneys, accountants, investment advisors, and other professionals.

ARTICLE IV - DISTRIBUTION OF PROPERTY

4.1 SPECIFIC BEQUESTS. [If the testator wishes to make specific bequests of particular items, they should be listed here by amendment or supplement to this Will.]

4.2 RESIDUARY ESTATE. I give, devise, and bequeath all of my property and estate, both real and personal, of whatever kind and wherever situated, of which I may die seized or possessed, or to which I may be entitled at the time of my death, including any lapsed legacies or devises (hereinafter referred to as my "residuary estate"), as follows:

To {{beneficiary1_name}}, my {{beneficiary1_relation}}, I leave and bequeath {{beneficiary1_share}} percent ({{beneficiary1_share}}%) of my residuary estate, if {{beneficiary1_name}} survives me by thirty (30) days.

4.3 SURVIVORSHIP REQUIREMENT. Any beneficiary named herein must survive me by at least thirty (30) days to receive any bequest under this Will. If any beneficiary fails to survive me by thirty (30) days, the bequest to that beneficiary shall lapse and shall be distributed as part of my residuary estate.

4.4 PER STIRPES DISTRIBUTION. If any beneficiary named herein predeceases me or fails to survive me by the required period, leaving descendants who survive me, such descendants shall take per stirpes the share that such deceased beneficiary would have taken had such beneficiary survived me.

ARTICLE V - GUARDIAN FOR MINOR CHILDREN

5.1 APPOINTMENT OF GUARDIAN. If I have minor children at the time of my death, and if no natural parent survives me, then I hereby nominate and appoint {{guardian_name}}, currently residing at {{guardian_address}}, to serve as Guardian of the person and property of my minor children.

5.2 ALTERNATE GUARDIAN. If {{guardian_name}} is unable or unwilling to serve as Guardian, then I nominate [alternate guardian if specified] to serve as Guardian.

5.3 NO BOND. I direct that no Guardian named herein shall be required to post bond or other security.

ARTICLE VI - MISCELLANEOUS PROVISIONS

6.1 ADEMPTION. If any property specifically bequeathed is not owned by me at the time of my death, or has been sold or disposed of during my lifetime, such specific bequest shall be deemed adeemed and no substitution shall be made.

6.2 ABATEMENT. If my estate is insufficient to pay all bequests in full, specific bequests shall abate in the inverse order in which they appear in this Will.

6.3 SIMULTANEOUS DEATH. If any beneficiary and I shall die under such circumstances that the order of our deaths cannot be readily ascertained, it shall be conclusively presumed for the purposes of this Will that such beneficiary predeceased me.

6.4 GOVERNING LAW. This Will shall be governed by and construed in accordance with the laws of the State of {{state}}.

6.5 SEVERABILITY. If any provision of this Will is held invalid or unenforceable, the remaining provisions shall continue in full force and effect.

6.6 GENDER AND NUMBER. Whenever the context requires, the gender of all words used herein shall include the masculine, feminine, and neuter, and the number of all words shall include the singular and plural.

ARTICLE VII - TESTIMONIUM AND ATTESTATION

IN WITNESS WHEREOF, I have hereunto set my hand and seal this _____ day of _____________, 20___, declaring and publishing this instrument as my Last Will and Testament, in the presence of the undersigned witnesses, whom I have requested to become attesting witnesses hereto.


_____________________________________
{{testator_name}}, Testator


ATTESTATION OF WITNESSES

We, the undersigned witnesses, each do hereby certify and attest as follows: Each of us observed the signing of this Last Will and Testament by {{testator_name}}, the Testator, on the date indicated above; the Testator signed and executed this Will in our presence; the Testator appeared to be of sound mind and under no constraint or undue influence; we are competent to be witnesses; we each hereby sign this Will as witnesses in the presence of the Testator and in the presence of each other; and we understand this to be the Testator's Last Will and Testament.

We declare under penalty of perjury that the foregoing is true and correct.

Executed on _________________, 20___, at _________________, {{state}}.


_____________________________________     _____________________________________
Witness #1 Signature                      Witness #1 Printed Name

Address: ___________________________     Date of Birth: ____________________

_____________________________________

_____________________________________


_____________________________________     _____________________________________
Witness #2 Signature                      Witness #2 Printed Name

Address: ___________________________     Date of Birth: ____________________

_____________________________________

_____________________________________


NOTARY ACKNOWLEDGMENT (If Required by State Law)

STATE OF {{state}}     )
                       ) ss.
COUNTY OF ____________ )

On this _____ day of _____________, 20___, before me, a Notary Public in and for said State, personally appeared {{testator_name}}, known to me to be the person whose name is subscribed to the foregoing instrument, and acknowledged that he/she executed the same as his/her free act and deed.


_____________________________________
Notary Public

My Commission Expires: _______________


SELF-PROVING AFFIDAVIT
(Attach if required by your state - consult local requirements)

---

LEGAL DISCLAIMER: This Last Will and Testament is a legal template and may not be suitable for all situations. Wills are subject to specific formal requirements that vary by state, including witnessing, notarization, and self-proving affidavit requirements. This document does not constitute legal advice. You should consult with a licensed attorney in your state to ensure your Will is valid, properly executed, and addresses your specific circumstances, especially if you have substantial assets, complex family situations, tax concerns, or special needs beneficiaries. Failure to properly execute a Will may result in intestacy and distribution contrary to your wishes.`
  },
  {
    id: 'power-of-attorney',
    name: 'Power of Attorney',
    description: 'Grant legal authority to someone to act on your behalf for financial or medical decisions.',
    category: 'Estate Planning & Personal',
    price: 6,
    fields: [
      { id: 'principal_name', label: 'Your Name (Principal)', type: 'text', required: true },
      { id: 'principal_address', label: 'Your Address', type: 'textarea', required: true },
      { id: 'principal_dob', label: 'Your Date of Birth', type: 'date', required: true },
      { id: 'agent_name', label: 'Agent Name', type: 'text', required: true, helpText: 'Person receiving authority' },
      { id: 'agent_address', label: 'Agent Address', type: 'textarea', required: true },
      { id: 'alternate_agent', label: 'Alternate Agent Name', type: 'text', required: false },
      { id: 'poa_type', label: 'Type of Power of Attorney', type: 'select', options: ['General', 'Limited', 'Durable', 'Medical'], required: true },
      { id: 'effective_date', label: 'Effective Date', type: 'date', required: true },
      { id: 'state', label: 'State', type: 'text', required: true },
    ],
    template: `DURABLE POWER OF ATTORNEY

NOTICE: THE POWERS GRANTED BY THIS DOCUMENT ARE BROAD AND SWEEPING. THEY ARE EXPLAINED IN THE DURABLE POWER OF ATTORNEY ACT. IF YOU HAVE ANY QUESTIONS ABOUT THESE POWERS, OBTAIN COMPETENT LEGAL ADVICE. THIS DOCUMENT DOES NOT AUTHORIZE ANYONE TO MAKE MEDICAL AND OTHER HEALTH-CARE DECISIONS FOR YOU. YOU MAY REVOKE THIS POWER OF ATTORNEY IF YOU LATER WISH TO DO SO.

I, {{principal_name}}, born on {{principal_dob}}, currently residing at {{principal_address}} (hereinafter referred to as "Principal"), being of sound mind and not acting under duress, fraud, or undue influence, do hereby make, constitute, and appoint {{agent_name}}, currently residing at {{agent_address}} (hereinafter referred to as "Agent" or "Attorney-in-Fact"), as my true and lawful Attorney-in-Fact, to act in my name, place, and stead in any manner which I myself could do if personally present, with respect to the powers herein granted.

ARTICLE I - DESIGNATION OF AGENT

1.1 PRIMARY AGENT. I hereby designate {{agent_name}} to serve as my Agent and Attorney-in-Fact.

1.2 SUCCESSOR AGENT. If {{agent_name}} is unable or unwilling to serve or continue to serve as my Agent, I hereby designate {{alternate_agent}} to serve as my successor Agent, with all the same powers and authority granted to my primary Agent.

1.3 AGENT'S AUTHORITY. My Agent shall have full power and authority to act on my behalf, subject to the limitations and special instructions, if any, set forth herein.

ARTICLE II - EFFECTIVE DATE AND DURABILITY

2.1 EFFECTIVE DATE. This Power of Attorney shall be effective immediately upon execution on {{effective_date}}, unless otherwise specified herein.

2.2 DURABLE PROVISIONS. This Power of Attorney shall not be affected by my subsequent disability or incapacity. This Power of Attorney shall continue to be effective if I become disabled, incapacitated, or incompetent, in accordance with the Durable Power of Attorney statutes of the State of {{state}}.

ARTICLE III - POWERS GRANTED

I grant to my Agent full power and authority to undertake and perform the following acts on my behalf:

3.1 REAL PROPERTY TRANSACTIONS. To manage, sell, convey, lease, mortgage, or otherwise deal with any real property in which I have an interest, including but not limited to the power to:
   (a) Accept, execute, and deliver deeds, mortgages, leases, and other instruments;
   (b) Pay, collect, and compromise rents;
   (c) Make repairs and alterations to real property;
   (d) Grant easements and enter into covenants;
   (e) Subdivide, develop, or dedicate to public use.

3.2 PERSONAL PROPERTY TRANSACTIONS. To buy, sell, exchange, transfer, or otherwise deal with any personal property, tangible or intangible, including stocks, bonds, securities, and other investments.

3.3 BANKING AND FINANCIAL INSTITUTIONS. To:
   (a) Open, maintain, and close bank accounts;
   (b) Deposit and withdraw funds;
   (c) Write checks and make electronic transfers;
   (d) Apply for and use credit cards;
   (e) Access safe deposit boxes;
   (f) Negotiate and endorse checks and other instruments.

3.4 BUSINESS OPERATIONS. To conduct, operate, manage, or participate in any business, whether as a proprietor, partner, member, shareholder, or otherwise.

3.5 INSURANCE AND ANNUITIES. To purchase, pay premiums on, modify, terminate, or otherwise deal with any insurance policy or annuity contract.

3.6 RETIREMENT ACCOUNTS. To manage, receive distributions from, roll over, or make contributions to any retirement account, pension, or profit-sharing plan.

3.7 TAXES. To prepare, sign, and file tax returns; to pay taxes; to represent me before tax authorities; and to receive confidential tax information.

3.8 CLAIMS AND LITIGATION. To institute, prosecute, defend, compromise, or settle legal actions, claims, and proceedings; to hire attorneys and other professionals.

3.9 GOVERNMENT BENEFITS. To apply for, receive, and manage government benefits, including Social Security, Medicare, Medicaid, and veterans' benefits.

3.10 DIGITAL ASSETS. To access, manage, and control my digital assets, including but not limited to emails, social media accounts, online banking, and cloud storage.

3.11 GIFTS. [Optional] To make gifts of my property to my spouse, descendants, and charitable organizations, not to exceed $[amount] per year to any one recipient, provided that my Agent may not make gifts to himself/herself unless specifically authorized herein.

3.12 ESTATE PLANNING. To create, amend, revoke, or fund trusts; to change beneficiary designations; and to disclaim interests.

3.13 DELEGATION. To delegate any of these powers to others as my Agent deems appropriate.

3.14 GENERAL AUTHORITY. To perform any other lawful act necessary or appropriate to effectuate the powers granted herein.

ARTICLE IV - LIMITATIONS AND SPECIAL INSTRUCTIONS

4.1 LIMITATIONS. [Insert any limitations on the Agent's powers, such as "My Agent may not sell my primary residence" or "My Agent may not make gifts to himself/herself"]

4.2 SPECIAL INSTRUCTIONS. [Insert any special instructions or guidance for the Agent]

ARTICLE V - RELIANCE BY THIRD PARTIES

5.1 THIRD PARTY RELIANCE. Any third party who receives a copy of this Power of Attorney may rely upon and act under it. Revocation of this Power of Attorney is not effective as to a third party until the third party has actual knowledge of the revocation.

5.2 INDEMNIFICATION. I agree that any third party who acts in good faith reliance on this Power of Attorney shall be held harmless and indemnified by me and my estate from any loss suffered or liability incurred as a result of such reliance.

5.3 PHOTOCOPIES. A photocopy or electronic copy of this Power of Attorney shall have the same force and effect as the original.

ARTICLE VI - AGENT'S RESPONSIBILITIES

6.1 FIDUCIARY DUTY. My Agent is a fiduciary and must act in my best interests, avoid conflicts of interest, keep accurate records, and keep my property separate from the Agent's property.

6.2 RECORDS. My Agent shall keep complete and accurate records of all transactions undertaken on my behalf.

6.3 ACCOUNTING. My Agent shall provide an accounting of all transactions if requested by me or by any person authorized by law to request such accounting.

ARTICLE VII - COMPENSATION AND REIMBURSEMENT

7.1 COMPENSATION. My Agent shall serve [without compensation / with reasonable compensation for services rendered].

7.2 REIMBURSEMENT. My Agent shall be entitled to reimbursement for reasonable expenses incurred in the performance of duties under this Power of Attorney.

ARTICLE VIII - REVOCATION

8.1 RIGHT TO REVOKE. I reserve the right to revoke this Power of Attorney at any time by providing written notice to my Agent and to any third parties who may have relied upon this Power of Attorney.

8.2 AUTOMATIC REVOCATION. This Power of Attorney shall automatically terminate upon my death.

ARTICLE IX - GOVERNING LAW AND MISCELLANEOUS

9.1 GOVERNING LAW. This Power of Attorney shall be governed by and construed in accordance with the laws of the State of {{state}}.

9.2 SEVERABILITY. If any provision of this Power of Attorney is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.

9.3 CAPTIONS. Article and section captions are for convenience only and shall not affect the interpretation of this document.

IN WITNESS WHEREOF, I have executed this Durable Power of Attorney on the date written below.


Dated: ___________________, 20___


_____________________________________
{{principal_name}}, Principal


STATE OF {{state}}     )
                       ) ss.
COUNTY OF ____________ )

On this _____ day of _____________, 20___, before me, the undersigned Notary Public, personally appeared {{principal_name}}, known to me (or satisfactorily proven) to be the person whose name is subscribed to the foregoing instrument, and acknowledged that he/she executed the same for the purposes therein contained.

IN WITNESS WHEREOF, I have hereunto set my hand and official seal.


_____________________________________
Notary Public

My Commission Expires: _______________


AGENT'S CERTIFICATION AND ACCEPTANCE

I, {{agent_name}}, have read this Power of Attorney and am the person identified as Agent. I acknowledge my legal responsibilities as a fiduciary. I agree to act in the best interests of the Principal, to maintain accurate records, to avoid conflicts of interest, and to act in accordance with the powers granted and limitations imposed in this document.


_____________________________________     _____________________
{{agent_name}}, Agent                     Date


WITNESS ATTESTATION (If required by state law)

We, the undersigned witnesses, hereby certify that the Principal signed this Power of Attorney in our presence, and appeared to be of sound mind and under no duress or undue influence.


_____________________________________     _____________________
Witness #1 Signature                      Date

Printed Name: _______________________


_____________________________________     _____________________
Witness #2 Signature                      Date

Printed Name: _______________________


---

LEGAL DISCLAIMER: This Power of Attorney is a powerful legal document that grants broad authority to another person to manage your affairs. The laws governing Powers of Attorney vary by state and have specific requirements for execution, witnessing, and notarization. This template may not be suitable for all situations. You should consult with a licensed attorney to ensure this document is properly executed, meets your state's requirements, and addresses your specific needs. Medical decisions may require a separate Healthcare Power of Attorney or Advance Directive. Improper use or execution of a Power of Attorney can result in financial abuse, legal invalidity, or unintended consequences.`
  },
  {
    id: 'child-travel-consent',
    name: 'Child Travel Consent Form',
    description: 'Authorization for a minor child to travel domestically or internationally with another adult.',
    category: 'Estate Planning & Personal',
    price: 4,
    fields: [
      { id: 'parent_name', label: 'Parent/Guardian Name', type: 'text', required: true },
      { id: 'parent_address', label: 'Parent Address', type: 'textarea', required: true },
      { id: 'parent_phone', label: 'Parent Phone Number', type: 'tel', required: true },
      { id: 'parent_email', label: 'Parent Email', type: 'email', required: true },
      { id: 'child_name', label: 'Child Full Name', type: 'text', required: true },
      { id: 'child_dob', label: 'Child Date of Birth', type: 'date', required: true },
      { id: 'child_passport', label: 'Child Passport Number (if international)', type: 'text', required: false },
      { id: 'travel_adult', label: 'Traveling With (Adult Name)', type: 'text', required: true },
      { id: 'adult_relationship', label: 'Relationship to Child', type: 'text', required: true },
      { id: 'adult_phone', label: 'Adult Phone Number', type: 'tel', required: true },
      { id: 'destination', label: 'Travel Destination', type: 'text', required: true },
      { id: 'travel_dates', label: 'Travel Dates', type: 'text', required: true, placeholder: 'March 15-22, 2026' },
      { id: 'purpose', label: 'Purpose of Travel', type: 'textarea', required: true },
    ],
    template: `CHILD TRAVEL CONSENT AND AUTHORIZATION

TO WHOM IT MAY CONCERN:

I, {{parent_name}}, currently residing at {{parent_address}}, am the [parent/legal guardian] of {{child_name}}, born on {{child_dob}}{{child_passport}}, and I hereby grant permission and authorization for my child to travel with {{travel_adult}}, my {{adult_relationship}}, to the following destination:

TRAVEL INFORMATION:
• Destination: {{destination}}
• Travel Dates: {{travel_dates}}
• Purpose of Travel: {{purpose}}
• Accompanying Adult: {{travel_adult}}
• Adult's Phone Number: {{adult_phone}}

AUTHORIZATION AND CONSENT:

1. TRAVEL PERMISSION. I hereby authorize and grant permission for my child, {{child_name}}, to travel with {{travel_adult}} to {{destination}} during the dates specified above.

2. TEMPORARY GUARDIANSHIP. I hereby grant {{travel_adult}} temporary guardianship and custody of my child during the period of travel specified herein. This includes the authority to make day-to-day decisions regarding my child's care, welfare, and activities during the travel period.

3. MEDICAL AUTHORIZATION. I authorize {{travel_adult}} to consent to any and all medical, dental, hospital, or emergency treatment for my child that may be deemed necessary or advisable by a licensed physician, dentist, or other healthcare provider during the travel period. This includes, but is not limited to:
   • Emergency medical treatment
   • Routine medical care
   • Prescription and administration of medication
   • Diagnostic procedures and tests
   • Surgical procedures, if necessary for the health and well-being of my child

4. MEDICAL INFORMATION. My child has the following medical conditions, allergies, or special needs that the accompanying adult should be aware of:
   Conditions: [____________________________________]
   Allergies: [____________________________________]
   Medications: [____________________________________]
   Special Instructions: [____________________________________]

5. INSURANCE INFORMATION. My child is covered by health insurance:
   Insurance Company: [____________________________________]
   Policy Number: [____________________________________]

6. EMERGENCY CONTACT. In case of emergency, I can be reached at:
   Primary Phone: {{parent_phone}}
   Email: {{parent_email}}
   Alternative Contact: [____________________________________]

7. VALID PERIOD. This consent is valid from [start date] through [end date], and only for the specific travel described herein.

8. GOVERNING LAW. This authorization shall be governed by the laws of the jurisdiction where signed.

9. ACKNOWLEDGMENT. I acknowledge that:
   • I am the legal parent/guardian with full authority to grant this consent
   • All information provided herein is true and accurate
   • I have provided {{travel_adult}} with copies of any necessary documents (passport, birth certificate, insurance card)
   • I understand this consent may be required by airlines, border authorities, hotels, and medical providers

IDENTIFICATION DOCUMENTS PROVIDED:
☐ Copy of child's birth certificate
☐ Copy of child's passport
☐ Copy of health insurance card
☐ Copy of parent's ID
☐ Medical records (if applicable)
☐ Vaccination records (if required)

I declare under penalty of perjury that I am the legal parent or guardian of the above-named minor child and that I have the legal authority to grant this consent.


_____________________________________     _____________________
{{parent_name}}, Parent/Guardian          Date

Address: {{parent_address}}
Phone: {{parent_phone}}
Email: {{parent_email}}


NOTARIZATION (Strongly Recommended for International Travel)

STATE OF _________     )
                       ) ss.
COUNTY OF ________    )

On this _____ day of _____________, 20___, before me, a Notary Public, personally appeared {{parent_name}}, known to me (or satisfactorily proven) to be the person whose name is subscribed to the foregoing instrument, and acknowledged that he/she executed the same for the purposes therein contained.

IN WITNESS WHEREOF, I have hereunto set my hand and official seal.


_____________________________________
Notary Public

My Commission Expires: _______________


SECOND PARENT/GUARDIAN CONSENT (If Applicable)

If both parents/guardians share custody, both should sign:

I, [Second Parent Name], also consent to this travel arrangement.


_____________________________________     _____________________
Second Parent/Guardian Name               Date


---

LEGAL DISCLAIMER AND IMPORTANT NOTES:

INTERNATIONAL TRAVEL: If traveling internationally, this consent form should be notarized. Different countries have different requirements for minors traveling without both parents. Contact the embassy or consulate of the destination country for specific requirements. Some countries require specific forms or additional documentation.

DOMESTIC TRAVEL: While not always legally required for domestic travel within the United States, airlines and other authorities may request this consent form when a child is traveling with someone other than their parent or legal guardian.

ADDITIONAL DOCUMENTS: It is recommended to provide copies of the child's birth certificate, the parent's ID, and any custody agreements if applicable.

LEGAL ADVICE: This is a template form and may not meet all requirements for your specific situation. Consult with an attorney, especially for international travel or if you have complex custody arrangements.

CUSTODY CONSIDERATIONS: If parents are separated or divorced, both parents may need to consent unless one parent has sole custody. Failure to obtain proper consent from all legal guardians may result in denial of boarding or entry into a country.`
  },
  {
    id: 'prenuptial-agreement',
    name: 'Prenuptial Agreement',
    description: 'Pre-marriage contract defining property rights and financial arrangements.',
    category: 'Estate Planning & Personal',
    price: 9,
    fields: [
      { id: 'party_a_name', label: 'First Party Full Name', type: 'text', required: true },
      { id: 'party_a_address', label: 'First Party Address', type: 'textarea', required: true },
      { id: 'party_b_name', label: 'Second Party Full Name', type: 'text', required: true },
      { id: 'party_b_address', label: 'Second Party Address', type: 'textarea', required: true },
      { id: 'marriage_date', label: 'Intended Marriage Date', type: 'date', required: true },
      { id: 'party_a_assets', label: 'First Party Separate Assets', type: 'textarea', required: true },
      { id: 'party_a_debts', label: 'First Party Debts/Liabilities', type: 'textarea', required: false },
      { id: 'party_b_assets', label: 'Second Party Separate Assets', type: 'textarea', required: true },
      { id: 'party_b_debts', label: 'Second Party Debts/Liabilities', type: 'textarea', required: false },
      { id: 'state', label: 'State', type: 'text', required: true },
    ],
    template: `PRENUPTIAL AGREEMENT

THIS PRENUPTIAL AGREEMENT (hereinafter "Agreement") is entered into on this _____ day of _____________, 20___, by and between:

{{party_a_name}}, residing at {{party_a_address}} (hereinafter referred to as "Party A"),

and

{{party_b_name}}, residing at {{party_b_address}} (hereinafter referred to as "Party B"),

(Party A and Party B are sometimes hereinafter collectively referred to as the "Parties").

RECITALS

WHEREAS, the Parties intend to marry each other on or about {{marriage_date}}, and desire to enter into this Agreement in contemplation of their marriage;

WHEREAS, each Party has made a full, fair, and complete disclosure to the other of his or her assets, liabilities, income, and financial obligations;

WHEREAS, the Parties desire to establish and determine their respective rights and obligations with respect to their separate property, marital property, income, debts, and such other matters related to their financial affairs;

WHEREAS, both Parties acknowledge that they have been advised to seek and have had the opportunity to seek independent legal counsel;

WHEREAS, both Parties enter into this Agreement freely, voluntarily, and without duress, fraud, or undue influence;

WHEREAS, both Parties understand and agree to all terms and provisions of this Agreement;

NOW, THEREFORE, in consideration of the mutual promises, covenants, and agreements contained herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:

ARTICLE I - DEFINITIONS

1.1 "Separate Property" means property owned by a Party prior to marriage, property acquired by a Party during marriage by gift or inheritance, and property designated as separate by this Agreement.

1.2 "Marital Property" means property acquired by either Party during the marriage, except for Separate Property as defined herein.

1.3 "Income" means all earnings, salary, wages, bonuses, commissions, and other compensation received by a Party.

ARTICLE II - DISCLOSURE OF ASSETS AND LIABILITIES

2.1 PARTY A'S SEPARATE PROPERTY. Party A represents and warrants that he/she is the owner of the following separate property:

{{party_a_assets}}

2.2 PARTY A'S LIABILITIES. Party A acknowledges the following debts and liabilities:

{{party_a_debts}}

2.3 PARTY B'S SEPARATE PROPERTY. Party B represents and warrants that he/she is the owner of the following separate property:

{{party_b_assets}}

2.4 PARTY B'S LIABILITIES. Party B acknowledges the following debts and liabilities:

{{party_b_debts}}

2.5 FULL DISCLOSURE. Each Party warrants that the foregoing constitutes a complete and accurate disclosure of all assets and liabilities. Both Parties have attached a complete financial statement to this Agreement as Exhibit A (if applicable).

ARTICLE III - CHARACTERIZATION OF PROPERTY

3.1 SEPARATE PROPERTY REMAINS SEPARATE. All property currently owned by each Party, as disclosed in Article II, shall remain the separate property of that Party and shall not be subject to division or distribution in the event of divorce, separation, or death.

3.2 PROPERTY ACQUIRED DURING MARRIAGE. Except as otherwise provided herein:
   (a) Property acquired by either Party during the marriage through the use or investment of separate property funds shall remain the separate property of the acquiring Party.
   (b) Income earned from separate property shall remain separate property.
   (c) Any increase in value of separate property shall remain separate property.

3.3 COMMINGLING. If separate property is commingled with marital property, the burden shall be on the Party claiming separate property status to trace and identify such property.

3.4 MARITAL RESIDENCE. [Specify provisions regarding the marital residence, whether it will be separate or marital property, and how it will be titled and maintained.]

3.5 GIFTS BETWEEN PARTIES. Any gifts made by one Party to the other during the marriage shall become the separate property of the recipient Party.

ARTICLE IV - INCOME AND EARNINGS

4.1 INCOME TREATMENT. Income and earnings received by each Party during the marriage shall be treated as [separate property of the earning Party / marital property to be shared equally / other arrangement as specified].

4.2 BANK ACCOUNTS. Each Party may maintain separate bank accounts in his or her own name and shall have sole control over such accounts. Joint accounts may be established by mutual agreement.

ARTICLE V - DEBTS AND LIABILITIES

5.1 SEPARATE DEBTS. Each Party shall be solely responsible for his or her own debts and liabilities existing prior to the marriage or incurred in his or her individual name during the marriage.

5.2 INDEMNIFICATION. Each Party agrees to indemnify and hold harmless the other Party from any debts or obligations that are the separate responsibility of the indemnifying Party.

ARTICLE VI - SPOUSAL SUPPORT AND ALIMONY

6.1 WAIVER OF SPOUSAL SUPPORT. [Choose one:]
   [OPTION A] In the event of divorce or legal separation, each Party hereby waives any and all rights to spousal support, maintenance, or alimony from the other Party, except as otherwise provided by law.
   
   [OPTION B] The issue of spousal support shall be determined at the time of divorce or separation in accordance with applicable law, and neither Party waives the right to seek spousal support.

ARTICLE VII - ESTATE RIGHTS

7.1 WAIVER OF ESTATE RIGHTS. [Choose one:]
   [OPTION A] Each Party waives any right to inherit from the other Party's estate, except as specifically provided by Will, trust, or beneficiary designation.
   
   [OPTION B] Estate rights shall be governed by applicable law and any Wills or estate planning documents executed by the Parties.

7.2 LIFE INSURANCE. [Specify any agreements regarding life insurance policies and beneficiary designations.]

ARTICLE VIII - DIVISION OF PROPERTY UPON DIVORCE OR SEPARATION

8.1 SEPARATE PROPERTY. In the event of divorce or legal separation, each Party shall retain his or her separate property as defined in this Agreement.

8.2 MARITAL PROPERTY. Any marital property shall be divided as follows: [specify division, such as "equally between the Parties" or other arrangement].

ARTICLE IX - MODIFICATIONS AND AMENDMENTS

9.1 WRITTEN AMENDMENTS. This Agreement may be amended or modified only by a written instrument executed by both Parties with the same formality as this Agreement.

9.2 NO ORAL MODIFICATIONS. No oral statements or agreements shall modify or amend this Agreement.

ARTICLE X - GENERAL PROVISIONS

10.1 ENTIRE AGREEMENT. This Agreement constitutes the entire agreement between the Parties concerning the subject matter hereof and supersedes all prior agreements and understandings.

10.2 GOVERNING LAW. This Agreement shall be governed by and construed in accordance with the laws of the State of {{state}}.

10.3 SEVERABILITY. If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.

10.4 BINDING EFFECT. This Agreement shall be binding upon and inure to the benefit of the Parties and their respective heirs, executors, administrators, and assigns.

10.5 INDEPENDENT LEGAL COUNSEL. Both Parties acknowledge that they have been advised to seek independent legal counsel and have had adequate opportunity to do so. [Party A has been represented by [attorney name] / has knowingly waived representation.] [Party B has been represented by [attorney name] / has knowingly waived representation.]

10.6 VOLUNTARY EXECUTION. Both Parties acknowledge that they enter into this Agreement freely, voluntarily, without duress, fraud, or undue influence, and with full knowledge of its legal effect.

10.7 FAIR AND REASONABLE. Both Parties acknowledge that this Agreement is fair and reasonable and that they have had adequate time to review and consider its terms.

10.8 SURVIVABILITY. This Agreement shall survive the marriage of the Parties and shall remain in full force and effect until modified or revoked by written agreement of both Parties.

IN WITNESS WHEREOF, the Parties have executed this Prenuptial Agreement on the date first written above.


_____________________________________     _____________________
{{party_a_name}}, Party A                 Date


_____________________________________     _____________________
{{party_b_name}}, Party B                 Date


ACKNOWLEDGMENT BY PARTY A

STATE OF {{state}}     )
                       ) ss.
COUNTY OF ____________ )

On this _____ day of _____________, 20___, before me personally appeared {{party_a_name}}, known to me (or satisfactorily proven) to be the person whose name is subscribed to the foregoing instrument, and acknowledged that he/she executed the same for the purposes therein contained.

_____________________________________
Notary Public
My Commission Expires: _______________


ACKNOWLEDGMENT BY PARTY B

STATE OF {{state}}     )
                       ) ss.
COUNTY OF ____________ )

On this _____ day of _____________, 20___, before me personally appeared {{party_b_name}}, known to me (or satisfactorily proven) to be the person whose name is subscribed to the foregoing instrument, and acknowledged that he/she executed the same for the purposes therein contained.

_____________________________________
Notary Public
My Commission Expires: _______________


CERTIFICATE OF INDEPENDENT LEGAL COUNSEL FOR PARTY A

I, [Attorney Name], an attorney licensed to practice law in the State of {{state}}, hereby certify that I have represented {{party_a_name}} in connection with this Prenuptial Agreement. I have reviewed the Agreement with my client, explained its legal effect, and advised my client of his/her rights. My client has executed this Agreement freely and voluntarily after full consideration.

_____________________________________     _____________________
Attorney for Party A                      Date


CERTIFICATE OF INDEPENDENT LEGAL COUNSEL FOR PARTY B

I, [Attorney Name], an attorney licensed to practice law in the State of {{state}}, hereby certify that I have represented {{party_b_name}} in connection with this Prenuptial Agreement. I have reviewed the Agreement with my client, explained its legal effect, and advised my client of his/her rights. My client has executed this Agreement freely and voluntarily after full consideration.

_____________________________________     _____________________
Attorney for Party B                      Date


---

LEGAL DISCLAIMER: Prenuptial agreements are complex legal documents with significant implications for property rights, support obligations, and estate planning. The enforceability of prenuptial agreements varies by state and depends on factors including full financial disclosure, voluntariness, independent legal representation, and fairness. This template does not constitute legal advice and may not be enforceable in your jurisdiction without proper legal review. Both parties MUST seek independent legal counsel before signing a prenuptial agreement. Failure to have separate attorneys may render the agreement unenforceable. Consult with experienced family law attorneys in your state to ensure the agreement is valid, enforceable, and protects your interests. Some provisions (such as child support) cannot be waived by prenuptial agreement.`
  },

  // Real Estate & Property - SUPER PROFESSIONAL RESIDENTIAL LEASE
  residentialLeaseTemplate,
];

export function getTemplateById(id: string): DocumentTemplate | undefined {
  return documentTemplates.find(template => template.id === id);
}

export function getTemplatesByCategory(category: string): DocumentTemplate[] {
  return documentTemplates.filter(template => template.category === category);
}

export const categories = [
  'Estate Planning & Personal',
  'Real Estate & Property',
  'Business Contracts',
  'Business Formation',
  'Financial & Lending',
  'Digital & Website',
];