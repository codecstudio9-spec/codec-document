// PROFESSIONAL BILL OF SALE - VEHICLE TEMPLATE
// Complete vehicle sale agreement for private party transactions
// Includes federal odometer disclosure requirements

import { DocumentTemplate } from '../types/document';

export const billOfSaleVehicleTemplate: DocumentTemplate = {
  id: 'bill-of-sale-vehicle',
  name: 'Bill of Sale - Vehicle',
  description: 'Complete vehicle bill of sale for private party sales. Includes buyer/seller details, vehicle information, sale price, odometer disclosure (federal requirement), warranty/as-is terms, and notarization section.',
  category: 'Business & Contracts',
  price: 7.00,
  fields: [
    // Seller Information
    { 
      id: 'seller_name', 
      label: 'Seller Full Legal Name', 
      type: 'text', 
      required: true,
      helpText: 'Name as it appears on the vehicle title' 
    },
    { 
      id: 'seller_address', 
      label: 'Seller Street Address', 
      type: 'text', 
      required: true 
    },
    { 
      id: 'seller_city', 
      label: 'Seller City', 
      type: 'text', 
      required: true 
    },
    { 
      id: 'seller_state', 
      label: 'Seller State', 
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
    { 
      id: 'seller_zip', 
      label: 'Seller ZIP Code', 
      type: 'text', 
      required: true 
    },
    { 
      id: 'seller_phone', 
      label: 'Seller Phone Number', 
      type: 'tel', 
      required: true 
    },
    { 
      id: 'seller_email', 
      label: 'Seller Email', 
      type: 'email', 
      required: false 
    },
    { 
      id: 'seller_license', 
      label: 'Seller Driver\'s License Number', 
      type: 'text', 
      required: false,
      helpText: 'Optional but recommended for verification' 
    },
    
    // Buyer Information
    { 
      id: 'buyer_name', 
      label: 'Buyer Full Legal Name', 
      type: 'text', 
      required: true,
      helpText: 'Name as it will appear on the new title' 
    },
    { 
      id: 'buyer_address', 
      label: 'Buyer Street Address', 
      type: 'text', 
      required: true 
    },
    { 
      id: 'buyer_city', 
      label: 'Buyer City', 
      type: 'text', 
      required: true 
    },
    { 
      id: 'buyer_state', 
      label: 'Buyer State', 
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
    { 
      id: 'buyer_zip', 
      label: 'Buyer ZIP Code', 
      type: 'text', 
      required: true 
    },
    { 
      id: 'buyer_phone', 
      label: 'Buyer Phone Number', 
      type: 'tel', 
      required: true 
    },
    { 
      id: 'buyer_email', 
      label: 'Buyer Email', 
      type: 'email', 
      required: false 
    },
    { 
      id: 'buyer_license', 
      label: 'Buyer Driver\'s License Number', 
      type: 'text', 
      required: false,
      helpText: 'Optional but recommended for verification' 
    },
    
    // Vehicle Information
    { 
      id: 'vehicle_year', 
      label: 'Vehicle Year', 
      type: 'number', 
      required: true,
      placeholder: '2020' 
    },
    { 
      id: 'vehicle_make', 
      label: 'Vehicle Make', 
      type: 'text', 
      required: true,
      placeholder: 'Toyota, Honda, Ford, etc.',
      helpText: 'Manufacturer of the vehicle' 
    },
    { 
      id: 'vehicle_model', 
      label: 'Vehicle Model', 
      type: 'text', 
      required: true,
      placeholder: 'Camry, Civic, F-150, etc.' 
    },
    { 
      id: 'vehicle_trim', 
      label: 'Vehicle Trim/Style (Optional)', 
      type: 'text', 
      required: false,
      placeholder: 'EX, Limited, XLT, etc.' 
    },
    { 
      id: 'vehicle_vin', 
      label: 'Vehicle VIN (Vehicle Identification Number)', 
      type: 'text', 
      required: true,
      helpText: '17-character VIN located on dashboard or door jamb',
      placeholder: '1HGBH41JXMN109186' 
    },
    { 
      id: 'vehicle_color', 
      label: 'Vehicle Color', 
      type: 'text', 
      required: true,
      placeholder: 'Silver, Black, Blue, etc.' 
    },
    { 
      id: 'vehicle_body_type', 
      label: 'Body Type', 
      type: 'select',
      options: [
        'Sedan',
        'Coupe',
        'SUV',
        'Truck',
        'Van',
        'Minivan',
        'Convertible',
        'Hatchback',
        'Wagon',
        'Motorcycle',
        'RV/Motorhome',
        'Trailer',
        'Other'
      ],
      required: true 
    },
    { 
      id: 'vehicle_mileage', 
      label: 'Current Odometer Reading (Miles)', 
      type: 'number', 
      required: true,
      helpText: 'Exact mileage shown on odometer',
      placeholder: '75420' 
    },
    { 
      id: 'odometer_brand', 
      label: 'Odometer Status', 
      type: 'select',
      options: [
        'Actual Mileage',
        'Mileage Exceeds Mechanical Limits',
        'Not Actual Mileage - Warning',
        'Odometer Broken/Inoperable'
      ],
      required: true,
      helpText: 'Federal requirement - choose accurate status' 
    },
    { 
      id: 'title_number', 
      label: 'Title/Certificate Number', 
      type: 'text', 
      required: false,
      helpText: 'Number on the vehicle title' 
    },
    
    // Sale Information
    { 
      id: 'sale_price', 
      label: 'Sale Price ($)', 
      type: 'currency', 
      required: true,
      helpText: 'Total purchase price in US Dollars' 
    },
    { 
      id: 'payment_method', 
      label: 'Payment Method', 
      type: 'select',
      options: [
        'Cash',
        'Cashier\'s Check',
        'Personal Check',
        'Bank Wire Transfer',
        'Electronic Payment (Zelle, Venmo, etc.)',
        'Money Order',
        'Other'
      ],
      required: true 
    },
    { 
      id: 'payment_status', 
      label: 'Payment Status', 
      type: 'select',
      options: [
        'Paid in Full',
        'Partial Payment - Balance Due',
        'Payment Pending'
      ],
      required: true 
    },
    { 
      id: 'balance_due', 
      label: 'Balance Due (if applicable)', 
      type: 'currency', 
      required: false 
    },
    { 
      id: 'payment_due_date', 
      label: 'Balance Due Date (if applicable)', 
      type: 'date', 
      required: false 
    },
    
    // Vehicle Condition and Warranty
    { 
      id: 'vehicle_condition', 
      label: 'Vehicle Condition Statement', 
      type: 'select',
      options: [
        'AS-IS with NO WARRANTY',
        'AS-IS with Seller\'s Limited Warranty',
        'With Manufacturer\'s Warranty (Still Valid)',
        'With Extended Warranty'
      ],
      required: true,
      helpText: 'Most private sales are AS-IS' 
    },
    { 
      id: 'warranty_details', 
      label: 'Warranty Details (if applicable)', 
      type: 'textarea', 
      required: false,
      placeholder: 'Describe any warranty coverage, expiration dates, transferability, etc.' 
    },
    { 
      id: 'known_defects', 
      label: 'Known Defects/Issues (if any)', 
      type: 'textarea', 
      required: false,
      placeholder: 'List any known mechanical issues, damage, or defects. Honesty protects both parties.',
      helpText: 'Recommended for transparency' 
    },
    
    // Title and Lien Information
    { 
      id: 'title_status', 
      label: 'Title Status', 
      type: 'select',
      options: [
        'Clean Title - No Liens',
        'Salvage Title',
        'Rebuilt Title',
        'Lien/Loan Outstanding - To Be Paid Off',
        'Awaiting Title from DMV',
        'Other'
      ],
      required: true,
      helpText: 'Be honest about title status' 
    },
    { 
      id: 'lienholder_name', 
      label: 'Lienholder Name (if applicable)', 
      type: 'text', 
      required: false,
      helpText: 'Bank or lender with lien on vehicle' 
    },
    { 
      id: 'lien_payoff', 
      label: 'Lien Payoff Amount (if applicable)', 
      type: 'currency', 
      required: false 
    },
    
    // Additional Items Included
    { 
      id: 'included_items', 
      label: 'Additional Items Included in Sale', 
      type: 'textarea', 
      required: false,
      placeholder: 'Examples: spare tire, floor mats, roof rack, extra keys, owner\'s manual, service records, etc.',
      helpText: 'List any extras included with the vehicle' 
    },
    
    // Sale Date and Location
    { 
      id: 'sale_date', 
      label: 'Date of Sale', 
      type: 'date', 
      required: true,
      helpText: 'Date ownership transfers to buyer' 
    },
    { 
      id: 'sale_location', 
      label: 'Sale Location (City, State)', 
      type: 'text', 
      required: true,
      placeholder: 'Los Angeles, California' 
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
      helpText: 'Usually the state where the sale takes place' 
    },
  ],
  
  template: `BILL OF SALE - MOTOR VEHICLE

THIS BILL OF SALE is executed on {{sale_date}}, at {{sale_location}}, by and between:

--------------------------------------------------

SELLER:

Name: {{seller_name}}
Address: {{seller_address}}
         {{seller_city}}, {{seller_state}} {{seller_zip}}
Phone: {{seller_phone}}
{{#if seller_email}}Email: {{seller_email}}{{/if}}
{{#if seller_license}}Driver's License: {{seller_license}}{{/if}}

(hereinafter referred to as "Seller")

--------------------------------------------------

BUYER:

Name: {{buyer_name}}
Address: {{buyer_address}}
         {{buyer_city}}, {{buyer_state}} {{buyer_zip}}
Phone: {{buyer_phone}}
{{#if buyer_email}}Email: {{buyer_email}}{{/if}}
{{#if buyer_license}}Driver's License: {{buyer_license}}{{/if}}

(hereinafter referred to as "Buyer")

--------------------------------------------------

VEHICLE DESCRIPTION:

Year:           {{vehicle_year}}
Make:           {{vehicle_make}}
Model:          {{vehicle_model}}
{{#if vehicle_trim}}Trim/Style:     {{vehicle_trim}}{{/if}}
Body Type:      {{vehicle_body_type}}
Color:          {{vehicle_color}}
VIN:            {{vehicle_vin}}
{{#if title_number}}Title Number:   {{title_number}}{{/if}}

Current Odometer Reading: {{vehicle_mileage}} miles
Odometer Status: {{odometer_brand}}

--------------------------------------------------

ARTICLE 1 - SALE AND TRANSFER

1.1. SALE OF VEHICLE. Seller hereby sells, transfers, and conveys to Buyer, and Buyer hereby purchases from Seller, the motor vehicle described above (the "Vehicle"), free and clear of all liens and encumbrances, except as specifically disclosed in this Bill of Sale.

1.2. EFFECTIVE DATE. This sale shall be effective as of {{sale_date}} (the "Sale Date"). Title and risk of loss shall pass to Buyer on the Sale Date upon receipt of full payment.

--------------------------------------------------

ARTICLE 2 - PURCHASE PRICE AND PAYMENT

2.1. PURCHASE PRICE. The total purchase price for the Vehicle is:

    SALE PRICE: USD {{sale_price}} (United States Dollars)

2.2. PAYMENT METHOD. Payment shall be made by: {{payment_method}}

2.3. PAYMENT STATUS: {{payment_status}}

{{#if balance_due}}
2.4. BALANCE DUE. A balance of USD {{balance_due}} remains due and payable.
    {{#if payment_due_date}}Due Date: {{payment_due_date}}{{/if}}
    
    Until the balance is paid in full:
    • Seller retains legal title to the Vehicle
    • Buyer may not sell, transfer, or encumber the Vehicle
    • Seller may repossess the Vehicle if payment is not received by the due date
{{/if}}

2.5. RECEIPT OF PAYMENT. Seller acknowledges receipt of {{#if balance_due}}partial payment{{else}}full payment{{/if}} from Buyer in the amount specified above.

--------------------------------------------------

ARTICLE 3 - TITLE AND OWNERSHIP

3.1. TITLE STATUS: {{title_status}}

3.2. SELLER'S REPRESENTATIONS. Seller represents and warrants that:
    (a) Seller is the legal owner of the Vehicle with full right to sell;
    (b) The Vehicle identification information provided herein is true and accurate;
    (c) The odometer reading disclosed is accurate to the best of Seller's knowledge;
    (d) {{#if lienholder_name}}There is a lien on the Vehicle held by {{lienholder_name}} in the amount of approximately USD {{lien_payoff}}, which Seller agrees to pay off{{else}}The Vehicle is free and clear of all liens and encumbrances{{/if}};
    (e) Seller has disclosed all known material defects;
    (f) Seller has not received notice that the Vehicle has been stolen or is subject to any claim of theft.

3.3. TITLE DELIVERY. Seller agrees to deliver the properly signed and notarized Certificate of Title to Buyer {{#if lienholder_name}}within [X] days after lien payoff{{else}}immediately upon receipt of full payment{{/if}}.

{{#if lienholder_name}}
3.4. LIEN PAYOFF. Seller agrees to pay off the lien with {{lienholder_name}} and provide Buyer with evidence of lien release within a reasonable time after receiving payment from Buyer.
{{/if}}

--------------------------------------------------

ARTICLE 4 - CONDITION AND WARRANTY

4.1. VEHICLE CONDITION: {{vehicle_condition}}

{{#if warranty_details}}
4.2. WARRANTY INFORMATION:
{{warranty_details}}
{{/if}}

4.3. AS-IS DISCLAIMER (if applicable):
{{#if vehicle_condition}}
THIS VEHICLE IS SOLD "AS-IS" AND "WHERE-IS" WITH ALL FAULTS. SELLER MAKES NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE. BUYER ACCEPTS THE VEHICLE IN ITS PRESENT CONDITION AND ASSUMES ALL RISK OF ITS QUALITY AND PERFORMANCE.

BUYER ACKNOWLEDGES THAT:
• Buyer has inspected the Vehicle or waived the right to inspect;
• Buyer is satisfied with the Vehicle's condition;
• Buyer assumes all risk of repairs and defects;
• Seller has no obligation to repair or pay for any defects discovered after the sale;
• Buyer is purchasing the Vehicle based solely on Buyer's own inspection and judgment.
{{/if}}

{{#if known_defects}}
4.4. KNOWN DEFECTS AND ISSUES DISCLOSED BY SELLER:

{{known_defects}}

Buyer acknowledges being informed of the above defects and accepts the Vehicle with such defects.
{{/if}}

4.5. BUYER'S ACCEPTANCE. By signing this Bill of Sale, Buyer acknowledges having had the opportunity to inspect the Vehicle and accepts it in its current condition.

--------------------------------------------------

ARTICLE 5 - FEDERAL ODOMETER DISCLOSURE STATEMENT
(Required by Federal Law - 49 U.S.C. § 32705)

5.1. ODOMETER READING. The odometer of the Vehicle now reads {{vehicle_mileage}} miles.

5.2. ODOMETER STATUS: {{odometer_brand}}

I, {{seller_name}}, state that to the best of my knowledge:

☐ The odometer reading reflects the ACTUAL MILEAGE of the vehicle.

☐ The odometer reading EXCEEDS the mechanical limits of the odometer and is NOT the actual mileage. WARNING - ODOMETER DISCREPANCY.

☐ The odometer reading is NOT the actual mileage. WARNING - ODOMETER DISCREPANCY.

☐ The odometer is broken, disconnected, or non-functional, and the mileage cannot be determined.

5.3. FEDERAL WARNING: Federal and State law requires that you state the mileage upon transfer of ownership. Failure to complete this disclosure statement or providing a false statement may result in fines and/or imprisonment. The mileage disclosure must be given to the transferee in conjunction with the transfer of ownership.

5.4. SELLER'S CERTIFICATION. I hereby certify that the odometer information provided above is true and accurate to the best of my knowledge.

_____________________________________
Seller's Signature (Odometer Disclosure)

Date: ___________________________

5.5. BUYER'S ACKNOWLEDGMENT. I hereby acknowledge receiving this odometer disclosure statement.

_____________________________________
Buyer's Signature

Date: ___________________________

--------------------------------------------------

ARTICLE 6 - ADDITIONAL ITEMS AND ACCESSORIES

{{#if included_items}}
6.1. ITEMS INCLUDED IN SALE. The following items are included with the Vehicle:

{{included_items}}

6.2. Items not specifically listed above are not included unless separately agreed in writing.
{{else}}
6.1. ITEMS INCLUDED. Only the Vehicle itself is included. No additional accessories, equipment, or items are included unless specifically listed by the parties in writing.
{{/if}}

6.3. KEYS AND DOCUMENTS. Seller shall provide Buyer with:
    ☐ All available keys and key fobs
    ☐ Owner's manual (if available)
    ☐ Maintenance records (if available)
    ☐ Signed Certificate of Title
    ☐ Odometer Disclosure Statement (this document)

--------------------------------------------------

ARTICLE 7 - BUYER'S RESPONSIBILITIES

7.1. REGISTRATION AND TITLING. Buyer is solely responsible for:
    (a) Registering the Vehicle with the appropriate state motor vehicle department;
    (b) Transferring the title into Buyer's name;
    (c) Paying all registration fees, title fees, and applicable taxes;
    (d) Obtaining vehicle insurance as required by law;
    (e) Meeting all state-specific requirements for vehicle registration.

7.2. TIME LIMIT. Buyer should complete registration and title transfer within the time period required by state law (typically 10-30 days) to avoid penalties.

7.3. EMISSIONS AND SAFETY INSPECTIONS. Buyer is responsible for any required emissions testing, safety inspections, or smog checks required by Buyer's state of registration.

7.4. TAXES. Buyer is responsible for all sales tax, use tax, and other taxes due on this transaction as required by applicable state and local law.

--------------------------------------------------

ARTICLE 8 - SELLER'S RESPONSIBILITIES

8.1. NOTIFICATION OF SALE. Seller shall notify the state motor vehicle department of the sale within the time required by state law to avoid liability for future tickets, accidents, or other incidents involving the Vehicle.

8.2. RELEASE OF LIABILITY. Seller shall file a Release of Liability form with the state DMV/MVD to formally notify the state that Seller is no longer the owner of the Vehicle.

8.3. LICENSE PLATES. Seller shall [retain/transfer] the license plates according to state law requirements.

--------------------------------------------------

ARTICLE 9 - REPRESENTATIONS AND CERTIFICATIONS

9.1. SELLER CERTIFIES:
    ✓ I am the legal owner of the Vehicle and have the right to sell it
    ✓ The VIN and vehicle information provided are accurate
    ✓ The Vehicle has not been reported stolen
    ✓ {{#if lienholder_name}}There is a lien that I will pay off{{else}}The title is free and clear of liens{{/if}}
    ✓ I have disclosed all known defects to the best of my knowledge
    ✓ The odometer reading is accurate to the best of my knowledge
    ✓ I will provide a properly signed title to the Buyer
    ✓ I will notify the DMV/MVD of this sale

9.2. BUYER CERTIFIES:
    ✓ I have inspected the Vehicle or waived my right to inspect
    ✓ I accept the Vehicle in its current condition
    ✓ I understand I am purchasing AS-IS (if applicable)
    ✓ I will register and title the Vehicle in my name
    ✓ I will obtain insurance as required by law
    ✓ I will pay all applicable taxes and fees
    ✓ I understand this transaction is governed by state and federal law

--------------------------------------------------

ARTICLE 10 - LIABILITY AND RISK OF LOSS

10.1. TRANSFER OF RISK. Risk of loss or damage to the Vehicle passes to Buyer on {{sale_date}} upon Buyer taking possession, regardless of when title officially transfers.

10.2. INSURANCE. Buyer is responsible for obtaining insurance coverage on the Vehicle immediately upon taking possession. Seller's insurance will no longer cover the Vehicle after the Sale Date.

10.3. LIABILITY RELEASE. As of {{sale_date}}, Seller shall not be liable for any tickets, accidents, damages, injuries, or other incidents involving the Vehicle. Buyer assumes all such liability.

--------------------------------------------------

ARTICLE 11 - DISPUTE RESOLUTION

11.1. GOVERNING LAW. This Bill of Sale shall be governed by and construed in accordance with the laws of the State of {{governing_state}}, without regard to its conflict of law principles.

11.2. DISPUTES. Any disputes arising from this transaction shall be resolved through:
    (a) Good faith negotiation between the parties;
    (b) If negotiation fails, mediation or arbitration as mutually agreed;
    (c) If necessary, legal action in the courts of {{governing_state}}.

11.3. ATTORNEY'S FEES. In the event of a legal dispute, the prevailing party may be entitled to recover reasonable attorney's fees and costs.

--------------------------------------------------

ARTICLE 12 - GENERAL PROVISIONS

12.1. ENTIRE AGREEMENT. This Bill of Sale constitutes the entire agreement between Seller and Buyer regarding the sale of the Vehicle and supersedes all prior negotiations, understandings, and agreements.

12.2. AMENDMENTS. This Bill of Sale may not be amended or modified except by a written instrument signed by both Seller and Buyer.

12.3. SEVERABILITY. If any provision of this Bill of Sale is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.

12.4. BINDING EFFECT. This Bill of Sale shall be binding upon and inure to the benefit of the parties and their respective heirs, executors, administrators, successors, and assigns.

12.5. COUNTERPARTS. This Bill of Sale may be executed in multiple counterparts, each of which shall be deemed an original and all of which together shall constitute one and the same document.

12.6. NO WARRANTIES BY SELLER (AS-IS SALES). Unless expressly stated otherwise in this document, Seller makes no representations or warranties regarding the Vehicle's condition, quality, merchantability, or fitness for any particular purpose.

--------------------------------------------------

ARTICLE 13 - SIGNATURES AND ACKNOWLEDGMENT

IN WITNESS WHEREOF, the parties have executed this Bill of Sale as of the date first written above.


SELLER:

_____________________________________
{{seller_name}}

Signature: ___________________________

Date: _______________________________

Printed Name: ________________________


BUYER:

_____________________________________
{{buyer_name}}

Signature: ___________________________

Date: _______________________________

Printed Name: ________________________


--------------------------------------------------

NOTARY ACKNOWLEDGMENT (Recommended - Required in Some States)

STATE OF {{seller_state}}     )
                               ) ss.
COUNTY OF _________________    )

On this _______ day of ________________, 20___, before me, a Notary Public in and for said State, personally appeared {{seller_name}} and {{buyer_name}}, known to me (or satisfactorily proven) to be the persons whose names are subscribed to the foregoing instrument, and acknowledged that they executed the same for the purposes therein contained.

IN WITNESS WHEREOF, I have hereunto set my hand and official seal.


_____________________________________
Notary Public

My Commission Expires: _______________

[NOTARY SEAL]


--------------------------------------------------

IMPORTANT LEGAL NOTICES AND DISCLAIMERS

⚠️ BUYER BEWARE - IMPORTANT CONSUMER PROTECTION INFORMATION:

1. VEHICLE HISTORY REPORT: Before purchasing any used vehicle, obtain a vehicle history report from Carfax, AutoCheck, or the National Motor Vehicle Title Information System (NMVTIS) using the VIN. Check for:
   • Accident history
   • Flood damage
   • Salvage/rebuilt title
   • Odometer rollback
   • Recall information
   • Number of previous owners
   • Maintenance records

2. PRE-PURCHASE INSPECTION: Have the vehicle inspected by an independent mechanic BEFORE completing the purchase. A pre-purchase inspection ($100-200) can save thousands in unexpected repairs.

3. TEST DRIVE: Always test drive the vehicle under various conditions (highway, city, parking) before purchase.

4. TITLE CHECK: Verify the seller's name on the title matches their ID and this Bill of Sale. Never buy a vehicle without a clear title in the seller's name.

5. LIEN CHECK: Contact your state DMV to verify there are no undisclosed liens on the vehicle. A lien search can prevent you from buying a vehicle the seller doesn't legally own.

6. AS-IS SALES: Most private party sales are "AS-IS" with no warranty. Once you drive away, all problems become yours. Inspect carefully.

7. EMISSIONS AND INSPECTION: Some states require emissions testing and/or safety inspection before registration. Factor this cost and potential failure into your decision.

--------------------------------------------------

STATE-SPECIFIC REQUIREMENTS (Examples - Check Your State):

• CALIFORNIA: Smog certificate required (unless exempt). Seller must provide within 90 days of sale.
• TEXAS: Vehicle inspection required within 7 days of sale for registration.
• NEW YORK: Bill of Sale must be notarized for DMV registration.
• FLORIDA: Title transfer must occur within 30 days to avoid late fees.
• MASSACHUSETTS: Must pass state inspection within 7 days of purchase.

ALWAYS CHECK YOUR STATE'S SPECIFIC REQUIREMENTS for:
✓ Notarization requirements for Bill of Sale
✓ Time limits for title transfer and registration
✓ Emissions and safety inspection requirements
✓ Sales tax collection and payment procedures
✓ Required forms and disclosures
✓ Lemon law protections (usually don't apply to private sales)

--------------------------------------------------

FEDERAL REQUIREMENTS:

1. ODOMETER DISCLOSURE (49 U.S.C. § 32705): Federal law REQUIRES accurate odometer disclosure for vehicles less than 20 years old. Violations can result in:
   • Civil penalties up to $10,000
   • Criminal penalties including fines and imprisonment
   • Buyer may sue for damages of $1,500 or three times actual damages, whichever is greater

2. RECALLS: Check for open safety recalls at www.nhtsa.gov/recalls or call the manufacturer. Dealers must fix recalls for free, even on used vehicles.

--------------------------------------------------

SELLER'S CHECKLIST - COMPLETE BEFORE/AFTER SALE:

☐ Verify VIN matches title and vehicle
☐ Complete and sign the title transfer section on the back of the title
☐ Complete odometer disclosure (this Bill of Sale satisfies federal requirement)
☐ Provide Bill of Sale to buyer (this document)
☐ Provide all keys, manuals, and documents
☐ Remove license plates (in most states)
☐ Cancel insurance on the vehicle
☐ File Notice of Transfer and Release of Liability with state DMV/MVD within required timeframe
☐ Keep a copy of the signed Bill of Sale for your records

--------------------------------------------------

BUYER'S CHECKLIST - COMPLETE IMMEDIATELY AFTER PURCHASE:

☐ Obtain vehicle history report if not done before purchase
☐ Obtain signed title from seller
☐ Obtain Bill of Sale (this document)
☐ Obtain all keys, manuals, and documents
☐ Obtain insurance coverage BEFORE driving the vehicle
☐ Register and title the vehicle with your state DMV within required timeframe (usually 10-30 days)
☐ Pay applicable sales tax, registration fees, and title fees
☐ Complete emissions/safety inspection if required by your state
☐ Update your insurance company with vehicle information
☐ Keep copies of all documents in a safe place

--------------------------------------------------

LEGAL DISCLAIMER:

This Bill of Sale template is provided for informational purposes only and does not constitute legal advice. Vehicle sales are governed by federal law (odometer disclosure, title requirements) and state law (registration, taxation, consumer protection), which vary significantly by jurisdiction. 

Consult with a licensed attorney in your state if you have questions or concerns about:
• Complex transactions (salvage titles, out-of-state sales, dealer sales)
• Disputes regarding vehicle condition or title issues
• Large transaction amounts
• Commercial vehicles or special vehicle types
• Installment payment plans or seller financing
• State-specific legal requirements

Both parties are encouraged to:
• Research their state's specific DMV/MVD requirements
• Understand their rights and obligations under state law
• Keep detailed records of the transaction
• Seek legal advice for complex situations

This template is designed for straightforward private party vehicle sales between individuals. It may not be suitable for dealer sales, auction sales, gift transfers, family transfers, or other special circumstances that may have different legal requirements.

--------------------------------------------------

This Bill of Sale was generated on {{current_month}} {{current_day}}, {{current_year}}.

BOTH PARTIES SHOULD RETAIN A SIGNED COPY FOR THEIR RECORDS.`
};