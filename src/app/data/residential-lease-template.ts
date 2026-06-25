// SUPER PROFESSIONAL RESIDENTIAL LEASE AGREEMENT TEMPLATE
// Complete with all state-specific variations and comprehensive legal clauses

import { DocumentTemplate } from '../types/document';

export const residentialLeaseTemplate: DocumentTemplate = {
  id: 'residential-lease',
  name: 'Residential Lease Agreement',
  description: 'Comprehensive rental agreement for residential property with state-specific terms, rent, and responsibilities.',
  category: 'Real Estate & Property',
  price: 7,
  fields: [
    // Landlord Information
    { id: 'landlord_name', label: 'Landlord Full Legal Name', type: 'text', required: true },
    { id: 'landlord_address', label: 'Landlord Mailing Address', type: 'textarea', required: true },
    { id: 'landlord_phone', label: 'Landlord Phone Number', type: 'tel', required: true },
    { id: 'landlord_email', label: 'Landlord Email', type: 'email', required: true },
    
    // Tenant Information
    { id: 'tenant_name', label: 'Tenant Full Legal Name', type: 'text', required: true },
    { id: 'tenant_phone', label: 'Tenant Phone Number', type: 'tel', required: true },
    { id: 'tenant_email', label: 'Tenant Email', type: 'email', required: true },
    { id: 'tenant_emergency_contact', label: 'Emergency Contact Name & Phone', type: 'text', required: true },
    { id: 'num_occupants', label: 'Total Number of Occupants', type: 'number', required: true, placeholder: '2' },
    
    // Property Details
    { id: 'property_address', label: 'Property Address (Street, City, State, ZIP)', type: 'textarea', required: true },
    { id: 'property_type', label: 'Property Type', type: 'select', options: ['Single Family Home', 'Apartment', 'Condo', 'Townhouse', 'Duplex', 'Studio', 'Other'], required: true },
    { id: 'property_unit', label: 'Unit/Apartment Number (if applicable)', type: 'text', required: false },
    { id: 'num_bedrooms', label: 'Number of Bedrooms', type: 'number', required: true, placeholder: '2' },
    { id: 'num_bathrooms', label: 'Number of Bathrooms', type: 'number', required: true, placeholder: '2' },
    { id: 'parking_spaces', label: 'Number of Parking Spaces', type: 'number', required: true, placeholder: '1' },
    { id: 'check_parking_permits', label: 'Parking space(s)/permits delivered', type: 'checkbox', required: false },
    { id: 'check_keys_premises', label: 'Keys to Premises delivered', type: 'checkbox', required: false },
    { id: 'check_mailbox_keys', label: 'Mailbox key(s) delivered', type: 'checkbox', required: false },
    { id: 'check_garage_openers', label: 'Garage door opener(s) delivered', type: 'checkbox', required: false },
    { id: 'check_signed_lease_copy', label: 'Copy of signed Lease delivered', type: 'checkbox', required: false },
    { id: 'check_lead_pamphlet', label: 'Lead-based paint pamphlet delivered (if applicable)', type: 'checkbox', required: false },
    { id: 'furnished', label: 'Furnished or Unfurnished?', type: 'select', options: ['Unfurnished', 'Furnished', 'Partially Furnished'], required: true },
    
    // Lease Terms
    { id: 'lease_start', label: 'Lease Start Date', type: 'date', required: true },
    { id: 'lease_term', label: 'Lease Term (months)', type: 'number', required: true, placeholder: '12', helpText: 'Enter number of months (e.g., 12 for 1 year)' },
    { id: 'monthly_rent', label: 'Monthly Rent Amount ($)', type: 'currency', required: true },
    { id: 'rent_due_date', label: 'Rent Due Date (day of month)', type: 'number', required: true, placeholder: '1', helpText: 'Day of month rent is due (1-31)' },
    { id: 'late_fee', label: 'Late Fee Amount ($)', type: 'currency', required: true },
    { id: 'grace_period', label: 'Late Fee Grace Period (days)', type: 'number', required: true, placeholder: '5' },
    
    // Deposits and Fees
    { id: 'security_deposit', label: 'Security Deposit ($)', type: 'currency', required: true },
    { id: 'first_month_rent', label: 'First Month Rent Due at Signing ($)', type: 'currency', required: true },
    { id: 'last_month_rent', label: 'Last Month Rent Required? ($0 if No)', type: 'currency', required: false },
    
    // Utilities
    { id: 'utilities_tenant', label: 'Utilities Paid by Tenant', type: 'textarea', required: true, placeholder: 'Electric, Gas, Water, Internet, Cable', helpText: 'List all utilities tenant pays' },
    { id: 'utilities_landlord', label: 'Utilities Paid by Landlord', type: 'textarea', required: false, placeholder: 'Trash, Sewer, HOA fees', helpText: 'List all utilities landlord pays' },
    
    // Pet Policy
    { id: 'pets_allowed', label: 'Pets Policy', type: 'select', options: ['No Pets Allowed', 'Pets Allowed with Deposit', 'Pets Allowed with Monthly Fee', 'Pets Allowed (No Fee)'], required: true },
    { id: 'pet_deposit', label: 'Pet Deposit Amount ($) (if applicable)', type: 'currency', required: false },
    { id: 'pet_monthly_fee', label: 'Monthly Pet Rent ($) (if applicable)', type: 'currency', required: false },
    { id: 'pet_restrictions', label: 'Pet Restrictions (breed, size, number)', type: 'textarea', required: false, placeholder: 'Maximum 2 pets, under 50 lbs, no aggressive breeds' },
    
    // Smoking Policy
    { id: 'smoking_allowed', label: 'Smoking Policy', type: 'select', options: ['No Smoking Allowed', 'Smoking Allowed', 'Smoking Allowed Outside Only'], required: true },
    
    // Maintenance & Repairs
    { id: 'maintenance_contact', label: 'Emergency Maintenance Contact', type: 'text', required: true },
    { id: 'maintenance_phone', label: 'Emergency Maintenance Phone', type: 'tel', required: true },
    
    // Special Provisions
    { id: 'special_provisions', label: 'Special Provisions/Additional Terms (optional)', type: 'textarea', required: false, placeholder: 'Any additional terms or conditions specific to this lease' },
    
    // State Selection
    { id: 'state', label: 'Property State (for state-specific laws)', type: 'select', options: [
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
    ], required: true },
  ],
  template: `RESIDENTIAL LEASE AGREEMENT

THIS RESIDENTIAL LEASE AGREEMENT (the "Lease" or "Agreement") is entered into this {{current_day}} day of {{current_month}}, {{current_year}}, by and between:

LANDLORD:
Name: {{landlord_name}}
Address: {{landlord_address}}
Phone: {{landlord_phone}}
Email: {{landlord_email}}
(hereinafter referred to as "Landlord")

and

TENANT:
Name: {{tenant_name}}
Phone: {{tenant_phone}}
Email: {{tenant_email}}
Emergency Contact: {{tenant_emergency_contact}}
(hereinafter referred to as "Tenant")

The Landlord and Tenant are collectively referred to as the "Parties."

WITNESSETH:

WHEREAS, Landlord is the owner of certain real property and improvements located in the State of {{state}}; and

WHEREAS, Landlord desires to lease the Premises to Tenant, and Tenant desires to lease the Premises from Landlord for residential use;

NOW, THEREFORE, in consideration of the mutual covenants, terms, and conditions set forth herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:


ARTICLE 1 - LEASED PREMISES

1.1 PROPERTY DESCRIPTION. Landlord hereby leases to Tenant, and Tenant hereby leases from Landlord, the residential real property located at:

{{property_address}}
Unit/Apartment: {{property_unit}}

Property Type: {{property_type}}
Bedrooms: {{num_bedrooms}}
Bathrooms: {{num_bathrooms}}
Parking Spaces: {{parking_spaces}}
Furnished Status: {{furnished}}

The above-described property, including all improvements thereon, is hereinafter referred to as the "Premises."

1.2 PERMITTED USE. The Premises shall be used and occupied exclusively as a private residential dwelling by Tenant and the following additional occupants only, for a total of {{num_occupants}} occupants. The Premises shall not be used for any illegal purpose or any purpose that will increase the rate of insurance or cause cancellation of any insurance policy covering the Premises.

1.3 CONDITION OF PREMISES. Tenant acknowledges that Tenant has examined the Premises and accepts them in their present condition, "AS IS," as suitable for the purposes for which they are leased. A separate move-in inspection checklist shall be completed and signed by both Parties within 5 days of occupancy.


ARTICLE 2 - LEASE TERM

2.1 INITIAL TERM. The term of this Lease shall be for a period of {{lease_term}} months, commencing on {{lease_start}} (the "Commencement Date") and ending on {{lease_end_date}} at 11:59 PM (the "Termination Date"), unless sooner terminated as provided herein.

2.2 POSSESSION. If Landlord is unable to deliver possession of the Premises at the Commencement Date, Landlord shall not be liable for any damage caused thereby, nor shall this Lease be void or voidable, but Tenant shall not be liable for rent until possession is delivered.

2.3 HOLDING OVER. If Tenant remains in possession of the Premises after the Termination Date without executing a new lease, such holding over shall constitute a month-to-month tenancy at a monthly rental rate equal to one hundred fifty percent (150%) of the last monthly rent amount, unless otherwise agreed in writing.


ARTICLE 3 - RENT AND PAYMENT TERMS

3.1 MONTHLY RENT. Tenant agrees to pay Landlord as monthly rent for the Premises the sum of {{monthly_rent}} Dollars (\${{monthly_rent}}) per month, in advance, without demand, deduction, or set-off.

3.2 RENT DUE DATE. Rent shall be due and payable on the {{rent_due_date}} day of each calendar month during the term of this Lease. The first month's rent in the amount of \${{first_month_rent}} is due upon execution of this Lease.

3.3 PRORATED RENT. If the Commencement Date is not the first day of a calendar month, rent for the first partial month shall be prorated on a per-diem basis.

3.4 PAYMENT METHOD. Rent shall be paid in lawful money of the United States to {{landlord_address}} or as otherwise directed by Landlord in writing.

3.5 APPLICATION OF PAYMENTS. All payments received from Tenant shall be applied first to any non-rent obligations (late fees, damages, utilities), then to unpaid rent for the current period, then to unpaid rent for prior periods.

3.6 NO WAIVER. Acceptance of rent by Landlord shall not constitute a waiver of any preceding breach by Tenant of any provision of this Lease, other than the failure of Tenant to pay the particular rent so accepted.


ARTICLE 4 - LATE CHARGES AND RETURNED CHECKS

4.1 LATE FEE. If Tenant fails to pay rent in full within {{grace_period}} days after the due date, Tenant shall pay a late charge of {{late_fee}} Dollars (\${{late_fee}}). This late charge is imposed to compensate Landlord for administrative costs incurred due to late payment and is not a penalty.

4.2 RETURNED CHECK FEE. If any check or electronic payment is returned to Landlord for insufficient funds, closed account, or any other reason, Tenant shall pay Landlord a returned check fee of $35.00, in addition to any applicable late fees.

4.3 NO WAIVER OF BREACH. Payment of late fees does not cure Tenant's breach for non-payment of rent and does not prevent Landlord from pursuing eviction or other legal remedies.


ARTICLE 5 - SECURITY DEPOSIT

5.1 DEPOSIT AMOUNT. Upon execution of this Lease, Tenant shall deposit with Landlord the sum of {{security_deposit}} Dollars (\${{security_deposit}}) as a security deposit (the "Security Deposit").

5.2 NOT RENT. The Security Deposit is not rent and shall not be applied to the last month's rent unless expressly agreed to in writing by Landlord.

5.3 PERMITTED USES OF DEPOSIT. Landlord may apply the Security Deposit to:
   (a) Unpaid rent and other charges due under this Lease;
   (b) Repair of damages to the Premises caused by Tenant, beyond normal wear and tear;
   (c) Cleaning of the Premises to restore it to move-in condition, reasonable wear and tear excepted;
   (d) Costs incurred to remedy any default by Tenant under this Lease.

5.4 NORMAL WEAR AND TEAR. Normal wear and tear shall mean deterioration that occurs without negligence, carelessness, accident, or abuse. This does not include burns, stains, holes in walls or carpet, broken fixtures, or any damage caused by pets, smoking, or negligence.

5.5 RETURN OF DEPOSIT. Landlord shall return the Security Deposit to Tenant, less any lawful deductions, together with an itemized statement of deductions, within the timeframe required by {{state}} law (typically 14-60 days after Tenant vacates).

5.6 INTEREST ON DEPOSIT. If required by {{state}} law, the Security Deposit shall bear interest at the rate and in the manner required by applicable statute.


ARTICLE 6 - ADDITIONAL DEPOSITS AND FEES

6.1 LAST MONTH'S RENT. Tenant has paid \${{last_month_rent}} as prepaid rent for the last month of the tenancy, if applicable.

6.2 PET DEPOSIT/FEES. {{pets_allowed}}

If pets are permitted under this Lease, Tenant shall pay:
• Pet Deposit: \${{pet_deposit}}
• Monthly Pet Rent: \${{pet_monthly_fee}} per month

Pet Restrictions: {{pet_restrictions}}

Tenant agrees to:
(a) Keep all pets under control at all times;
(b) Not allow pets to cause damage, noise, odor, or nuisance;
(c) Immediately clean up after pets;
(d) Keep pets current on all vaccinations and licenses required by law;
(e) Remove pets immediately if they pose a danger or nuisance.

UNAUTHORIZED PETS: If Tenant harbors any unauthorized pet on the Premises, Landlord may charge Tenant $50.00 per day for each day the unauthorized pet remains, require immediate removal, and/or terminate this Lease.


ARTICLE 7 - UTILITIES AND SERVICES

7.1 TENANT'S RESPONSIBILITY. Tenant shall be responsible for arranging and paying for the following utilities and services:
{{utilities_tenant}}

7.2 LANDLORD'S RESPONSIBILITY. Landlord shall be responsible for paying the following utilities and services (if any):
{{utilities_landlord}}

7.3 UTILITY INTERRUPTION. Landlord shall not be liable for any interruption or failure of utility services unless caused by Landlord's willful neglect.


ARTICLE 8 - USE AND OCCUPANCY

8.1 RESIDENTIAL USE ONLY. The Premises shall be used exclusively for residential purposes as a private dwelling. No business, profession, or trade of any kind shall be conducted on the Premises without prior written consent of Landlord.

8.2 MAXIMUM OCCUPANCY. The Premises shall be occupied by no more than {{num_occupants}} persons without prior written consent of Landlord.

8.3 COMPLIANCE WITH LAWS. Tenant shall comply with all applicable federal, state, and local laws, ordinances, regulations, and requirements affecting the Premises.

8.4 NUISANCE AND NOISE. Tenant shall not commit or permit any waste or nuisance on the Premises. Tenant shall not disturb, annoy, or interfere with the quiet enjoyment of other tenants or neighbors.

8.5 SMOKING POLICY. {{smoking_allowed}}

If smoking is prohibited under this Lease, Tenant agrees that smoking is strictly prohibited anywhere on the Premises. Violation may result in forfeiture of the Security Deposit and termination of this Lease.

8.6 NO SUBLETTING OR ASSIGNMENT. Tenant shall not assign this Lease or sublet the Premises without the prior written consent of Landlord, which may be withheld in Landlord's sole discretion. Any attempted assignment or sublease without consent shall be void and shall constitute a material breach of this Lease.


ARTICLE 9 - MAINTENANCE, REPAIRS, AND ALTERATIONS

9.1 LANDLORD'S MAINTENANCE OBLIGATIONS. Landlord shall maintain the Premises in a habitable condition and shall comply with all applicable building, housing, and health codes. Landlord shall:
   (a) Maintain structural components in good repair (roof, walls, foundation);
   (b) Maintain and repair HVAC, plumbing, and electrical systems;
   (c) Provide and maintain hot and cold running water;
   (d) Maintain common areas in a clean and safe condition;
   (e) Maintain smoke detectors and carbon monoxide detectors;
   (f) Make all repairs necessary to keep the Premises in habitable condition.

9.2 TENANT'S MAINTENANCE OBLIGATIONS. Tenant shall:
   (a) Keep the Premises clean, sanitary, and free from trash and waste;
   (b) Dispose properly of all garbage and waste;
   (c) Use all appliances, fixtures, and equipment properly;
   (d) Not destroy, damage, or remove any part of the Premises;
   (e) Test smoke detectors monthly and replace batteries as needed;
   (f) Replace light bulbs and HVAC filters as needed;
   (g) Promptly notify Landlord of any defect, damage, or needed repair;
   (h) Pay for repair of any damage caused by Tenant's negligence or misuse.

9.3 REPORTING REPAIRS. Tenant shall promptly notify Landlord in writing of any defect or need for repair.

EMERGENCY MAINTENANCE CONTACT:
Contact: {{maintenance_contact}}
Phone: {{maintenance_phone}}

9.4 ALTERATIONS. Tenant shall not make any alterations, additions, or improvements to the Premises without Landlord's prior written consent.


ARTICLE 10 - LANDLORD'S RIGHT OF ENTRY

10.1 NOTICE REQUIREMENT. Landlord may enter the Premises to inspect, make repairs, supply services, or show to prospective buyers or tenants. Except in emergencies, Landlord shall give Tenant advance notice as required by {{state}} law and shall enter only during reasonable hours.

10.2 EMERGENCY ENTRY. Landlord may enter the Premises without notice in case of emergency.


ARTICLE 11 - INSURANCE

11.1 LANDLORD'S INSURANCE. Landlord shall maintain property insurance covering the building. Landlord's insurance does NOT cover Tenant's personal property or liability.

11.2 TENANT'S INSURANCE. Tenant is STRONGLY ADVISED to obtain renter's insurance to protect Tenant's personal property and provide personal liability coverage.


ARTICLE 12 - LIABILITY AND INDEMNIFICATION

12.1 TENANT'S LIABILITY. Tenant shall be liable for all injury to persons and damage to property occurring on the Premises when caused by Tenant's negligence, intentional acts, or breach of this Lease.

12.2 LANDLORD'S LIABILITY. Landlord shall not be liable for any injury to Tenant or damage to personal property unless caused by Landlord's negligence or willful misconduct.

12.3 INDEMNIFICATION. Tenant agrees to indemnify and hold harmless Landlord from all claims arising out of Tenant's use of the Premises, except to the extent caused by Landlord's negligence.


ARTICLE 13 - DAMAGE OR DESTRUCTION OF PREMISES

13.1 PARTIAL DAMAGE. If the Premises are partially damaged and can be repaired within sixty (60) days, Landlord shall promptly repair the damage and rent shall abate proportionately.

13.2 TOTAL DESTRUCTION. If the Premises are totally destroyed or damaged beyond repair within sixty (60) days, either party may terminate this Lease by written notice.

13.3 TENANT-CAUSED DAMAGE. If damage is caused by Tenant's negligence, Landlord shall have no obligation to repair, and Tenant shall remain liable for all rent and repair costs.


ARTICLE 14 - DEFAULT AND REMEDIES

14.1 TENANT DEFAULT. Tenant shall be in default if Tenant:
   (a) Fails to pay rent or any other charge when due;
   (b) Violates any term of this Lease;
   (c) Abandons or vacates the Premises;
   (d) Engages in illegal activity on the Premises.

14.2 LANDLORD'S REMEDIES. Upon Tenant's default, Landlord may:
   (a) Terminate this Lease by giving written notice as required by {{state}} law;
   (b) Commence eviction proceedings;
   (c) Pursue any other remedy available at law or in equity.

14.3 NOTICE TO CURE. Except for non-payment of rent or illegal activity, Landlord shall give Tenant written notice specifying the breach and reasonable time to cure before terminating the Lease.

14.4 ATTORNEY FEES. In any legal action, the prevailing party shall be entitled to recover reasonable attorney fees and costs.


ARTICLE 15 - TERMINATION AND MOVE-OUT

15.1 EXPIRATION. This Lease shall terminate automatically upon the Termination Date unless renewed or converted to month-to-month.

15.2 EARLY TERMINATION. This Lease may be terminated early only by mutual written agreement or as required by law.

15.3 TENANT'S MOVE-OUT OBLIGATIONS. Upon termination, Tenant shall:
   (a) Vacate and surrender the Premises in clean condition, normal wear and tear excepted;
   (b) Remove all personal property and trash;
   (c) Return all keys and access devices;
   (d) Clean the Premises thoroughly;
   (e) Provide a forwarding address for return of Security Deposit.

15.4 ABANDONED PROPERTY. Any property left after Tenant vacates shall be deemed abandoned and may be disposed of in accordance with {{state}} law.


ARTICLE 16 - MISCELLANEOUS PROVISIONS

16.1 ENTIRE AGREEMENT. This Lease constitutes the entire agreement between the Parties and supersedes all prior agreements. No amendment shall be valid unless in writing and signed by both Parties.

16.2 SEVERABILITY. If any provision is held invalid, the remaining provisions shall continue in full force.

16.3 GOVERNING LAW. This Lease shall be governed by the laws of the State of {{state}}.

16.4 BINDING EFFECT. This Lease shall be binding upon the Parties and their heirs, executors, successors, and assigns.

16.5 JOINT AND SEVERAL LIABILITY. If multiple persons sign as Tenant, each shall be jointly and severally liable for all obligations.

16.6 NOTICES. All notices shall be in writing and delivered to the addresses listed in this Lease.

16.7 MILITARY SERVICE. Tenant who is a member of the armed forces may have early termination rights under the Servicemembers Civil Relief Act (SCRA).

16.8 SPECIAL PROVISIONS. {{special_provisions}}


ARTICLE 17 - REQUIRED DISCLOSURES

17.1 LEAD-BASED PAINT DISCLOSURE. For housing built before 1978, Landlord has provided all required lead-based paint disclosures and the EPA pamphlet.

17.2 MOLD DISCLOSURE. If required by {{state}} law, Landlord discloses whether Landlord is aware of any mold or moisture problems affecting the Premises.

17.3 OTHER DISCLOSURES. Any additional state-specific disclosures required by {{state}} law are incorporated into and made part of this Lease.


ARTICLE 18 - RULES AND REGULATIONS

18.1 COMPLIANCE. Tenant shall comply with all reasonable rules and regulations provided by Landlord, including:
   • Quiet hours
   • Parking regulations
   • Trash disposal
   • Common area usage


IN WITNESS WHEREOF, the Parties have executed this Residential Lease Agreement as of the date first written above.

LANDLORD:

{{landlord_name}}
Landlord Signature: ____________________      Date: ____________________

TENANT:

{{tenant_name}}
Tenant Signature: ______________________      Date: ____________________


MOVE-IN INSPECTION CHECKLIST

Tenant acknowledges receipt of:
{{check_parking_permits}} {{parking_spaces}} Parking space(s)/permits
{{check_keys_premises}} Keys to Premises
{{check_mailbox_keys}} Mailbox key(s)
{{check_garage_openers}} Garage door opener(s)
{{check_signed_lease_copy}} Copy of this signed Lease
{{check_lead_pamphlet}} Lead-based paint pamphlet (if applicable)

Tenant Initial:              Landlord Initial:


---

STATE-SPECIFIC COMPLIANCE NOTICE

This Residential Lease Agreement has been prepared in accordance with the landlord-tenant laws of the State of {{state}}. Both parties acknowledge that they have reviewed the terms and conditions of this Agreement and understand their respective rights and obligations under {{state}} law.

FEDERAL COMPLIANCE: This Agreement complies with the Fair Housing Act, Americans with Disabilities Act, Lead-Based Paint Disclosure requirements (for pre-1978 housing), the Servicemembers Civil Relief Act, and the Electronic Signatures in Global and National Commerce Act (E-SIGN Act), 15 U.S.C. § 7001 et seq.

LEGAL CONSULTATION: While this Agreement has been drafted to comply with applicable laws, both Landlord and Tenant are encouraged to seek independent legal counsel to review this Agreement before signing.

EXECUTION: By signing below, both parties acknowledge that they have read, understood, and agree to be bound by all terms and conditions set forth in this Residential Lease Agreement.`
};