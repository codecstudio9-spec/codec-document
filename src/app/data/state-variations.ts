// State-specific document variations
// Different states have different legal requirements for certain documents

export const US_STATES = [
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
];

// Documents that vary significantly by state
export const STATE_DEPENDENT_DOCUMENTS = [
  'last-will-testament',
  'residential-lease',
  'eviction-notice',
  'llc-operating-agreement',
  'articles-of-organization',
];

// State-specific legal notes
export const stateNotes: Record<string, Record<string, string>> = {
  'last-will-testament': {
    'California': 'California requires two witnesses for wills. Community property state - special rules apply for married couples.',
    'Florida': 'Florida requires two witnesses and notarization. Homestead property has special protections.',
    'Texas': 'Texas allows both attested and holographic wills. Community property state.',
    'New York': 'New York requires two witnesses. Specific language for residuary clauses recommended.',
    'Louisiana': 'Louisiana has unique civil law requirements. Notarial wills are common. Forced heirship laws apply.',
  },
  'residential-lease': {
    'Alabama': 'Alabama Code Title 35 Ch.9A governs landlord-tenant law. Security deposit limited to one month\'s rent. Landlord must return deposit within 35 days of move-out.',
    'Alaska': 'Alaska Stat. §34.03 governs residential leases. Security deposit limited to 2 months rent. Landlord must return deposit within 14 days (30 days if tenant disputes).',
    'Arizona': 'Arizona Residential Landlord and Tenant Act applies. Security deposit limited to 1.5 months rent. Deposit must be returned within 14 business days.',
    'Arkansas': 'Arkansas Code §18-16 applies. No statutory limit on security deposit. Deposit must be returned within 60 days with written itemization.',
    'California': 'California Civil Code §1940 et seq. applies. Security deposit limited to 2 months rent (unfurnished). Must return deposit within 21 days. Rent control in many cities including LA, SF, Oakland.',
    'Colorado': 'Colorado Revised Statutes §38-12 applies. No statutory limit on deposit. Must return within 1 month (or as specified in lease up to 60 days). New 2024 rules limit late fees.',
    'Connecticut': 'Connecticut General Statutes §47a applies. Security deposit limited to 2 months rent (1 month if tenant is 62+). Must return within 30 days.',
    'Delaware': 'Delaware Residential Landlord-Tenant Code applies. Security deposit limited to 1 month rent after 1 year. Must return within 20 days.',
    'Florida': 'Florida Statutes Chapter 83 applies. Security deposit must be held in a Florida financial institution. Must return with written notice within 15 days (30 days if claiming deductions). Mold disclosure required.',
    'Georgia': 'Georgia Code §44-7 applies. No limit on security deposit. Deposit must be returned within 30 days with itemized list of deductions.',
    'Hawaii': 'Hawaii Revised Statutes §521 applies. Security deposit limited to 1 month rent. Must return within 14 days of move-out.',
    'Idaho': 'Idaho Code §6-320 applies. No statutory limit on deposit. Must return within 21 days (30 days if tenant gives no forwarding address).',
    'Illinois': 'Illinois Landlord-Tenant Act applies. Chicago has additional strict ordinances. Security deposit interest required in municipalities over 25,000 population. Must return within 30 days.',
    'Indiana': 'Indiana Code §32-31-3 applies. No statutory limit on security deposit. Must return within 45 days with itemized deductions.',
    'Iowa': 'Iowa Code §562A applies. Security deposit limited to 2 months rent. Must return within 30 days.',
    'Kansas': 'Kansas Residential Landlord and Tenant Act applies. Security deposit limited to 1 month rent (unfurnished) or 1.5 months (furnished). Must return within 14-30 days.',
    'Kentucky': 'Kentucky Revised Statutes §383 applies. No statutory deposit limit. Must return within 30-60 days.',
    'Louisiana': 'Louisiana Civil Code governs. No statutory limit on security deposit. Landlord has 1 month to return deposit with itemization after lease ends.',
    'Maine': 'Maine Revised Statutes Title 14 §6001 applies. Security deposit limited to 2 months rent. Must return within 21 days (30 days if tenant disputes).',
    'Maryland': 'Maryland Code Real Property §8 applies. Security deposit limited to 2 months rent. Must return within 45 days. Deposit must be held in interest-bearing account.',
    'Massachusetts': 'Massachusetts General Laws Ch.186 applies. Security deposit limited to 1 month rent. Must return within 30 days. Interest required on deposit after first year.',
    'Michigan': 'Michigan Compiled Laws §554.601 applies. Security deposit limited to 1.5 months rent. Must return within 30 days.',
    'Minnesota': 'Minnesota Statutes §504B applies. No statutory deposit limit. Must return within 21 days (3 weeks). Landlord must pay interest on deposits held more than 1 year.',
    'Mississippi': 'Mississippi Code §89-8 applies. No statutory limit on security deposit. Must return within 45 days.',
    'Missouri': 'Missouri Revised Statutes §535 applies. Security deposit limited to 2 months rent. Must return within 30 days.',
    'Montana': 'Montana Code §70-25 applies. Security deposit limited to amount reasonably necessary. Must return within 30 days (10 days if no damage).',
    'Nebraska': 'Nebraska Revised Statutes §76-1401 applies. Security deposit limited to 1 month rent. Must return within 14 days.',
    'Nevada': 'Nevada Revised Statutes Chapter 118A applies. Security deposit limited to 3 months rent. Must return within 30 days.',
    'New Hampshire': 'New Hampshire Revised Statutes §540-A applies. Security deposit limited to 1 month rent or $100, whichever is greater. Must return within 30 days.',
    'New Jersey': 'New Jersey Landlord-Tenant Laws apply (N.J.S.A. 46:8-19). Security deposit limited to 1.5 months rent. Landlord must pay interest on deposit annually.',
    'New Mexico': 'New Mexico Statutes §47-8 applies. Security deposit limited to 1 month rent (for leases under 1 year). Must return within 30 days.',
    'New York': 'New York Real Property Law applies. NYC has rent stabilization. Security deposits limited to 1 month rent statewide (as of 2019). Must return within 14 days of move-out.',
    'North Carolina': 'North Carolina General Statutes §42 applies. Security deposit limited to 1.5 months rent (for month-to-month) or 2 months rent (term lease). Must return within 30 days.',
    'North Dakota': 'North Dakota Century Code §47-16 applies. Security deposit limited to 1 month rent. Must return within 30 days.',
    'Ohio': 'Ohio Revised Code §5321 applies. Security deposit limited to no statutory cap but landlord must pay 5% interest annually on amounts over $50. Must return within 30 days.',
    'Oklahoma': 'Oklahoma Residential Landlord and Tenant Act applies. Security deposit limited to amount set by parties. Must return within 45 days.',
    'Oregon': 'Oregon Revised Statutes Chapter 90 applies. No statutory limit on security deposit. Must return within 31 days. Portland has additional tenant protections.',
    'Pennsylvania': 'Pennsylvania Landlord-Tenant Act applies. Security deposit limited to 2 months rent first year, 1 month thereafter. Must return within 30 days.',
    'Rhode Island': 'Rhode Island General Laws §34-18 applies. Security deposit limited to 1 month rent. Must return within 20 days.',
    'South Carolina': 'South Carolina Code §27-40 applies. No statutory limit on security deposit. Must return within 30 days.',
    'South Dakota': 'South Dakota Codified Laws §43-32 applies. Security deposit limited to 1 month rent. Must return within 14 days (2 weeks).',
    'Tennessee': 'Tennessee Code §66-28 applies. No statutory limit on security deposit. Must return within 30 days.',
    'Texas': 'Texas Property Code Chapter 92 applies. No statutory deposit limit. Must return within 30 days with itemized deductions. No statewide rent control.',
    'Utah': 'Utah Code §57-22 applies. No statutory deposit limit but reasonableness standard applies. Must return within 30 days.',
    'Vermont': 'Vermont Statutes Title 9 §4461 applies. No statutory deposit limit. Must return within 14 days.',
    'Virginia': 'Virginia Residential Landlord and Tenant Act applies. Security deposit limited to 2 months rent. Must return within 45 days.',
    'Washington': 'Washington Residential Landlord-Tenant Act applies. No statutory deposit cap. Must return within 21 days. Seattle has additional protections.',
    'West Virginia': 'West Virginia Code §37-6 applies. No statutory deposit limit. Must return within 60 days.',
    'Wisconsin': 'Wisconsin Statutes §704 applies. No statutory deposit limit. Must return within 21 days.',
    'Wyoming': 'Wyoming Statutes §1-21-1203 applies. No statutory deposit limit. Must return within 30 days (15 days if no damage).',
  },
  'eviction-notice': {
    'California': 'California requires 3-day notice for non-payment, 30-60 days for no-fault eviction. AB 1482 rent cap applies.',
    'Florida': 'Florida requires 3-day notice for non-payment. 7-day notice for lease violations. Specific statutory language required.',
    'Texas': 'Texas requires 3-day notice to vacate. Self-help eviction is illegal. Justice court handles evictions.',
    'New York': 'New York requires 14-day notice for monthly tenants. COVID-19 protections may still apply. ERAP program available.',
    'Illinois': 'Illinois requires 5-day notice for non-payment in Chicago. 10-day notice for lease violations.',
  },
  'llc-operating-agreement': {
    'Delaware': 'Delaware is a popular state for LLC formation. Flexible operating agreement rules. Business-friendly courts.',
    'California': 'California requires $800 annual franchise tax. LLCs subject to gross receipts fee. Must file Statement of Information.',
    'Wyoming': 'Wyoming allows anonymous LLC formation. No state income tax. Low annual fees.',
    'Nevada': 'Nevada has no corporate or personal income tax. Strong privacy protections for LLC members.',
    'Texas': 'Texas has no state income tax. Franchise tax based on revenue. Must file Public Information Report annually.',
  },
};

// Add state-specific clauses to templates
export function getStateSpecificTemplate(baseTemplate: string, documentType: string, state: string, language: 'en' | 'es' = 'en'): string {
  if (!STATE_DEPENDENT_DOCUMENTS.includes(documentType)) {
    return baseTemplate;
  }

  let template = baseTemplate;

  // Add state-specific notes at the end
  const notes = stateNotes[documentType];
  if (notes && notes[state]) {
    template += language === 'es'
      ? `\n\n=== NOTAS ESPECÍFICAS DEL ESTADO DE ${state.toUpperCase()} ===\nEste documento incorpora variaciones legales aplicables al estado de ${state}.\n\nAVISO LEGAL: Este documento ha sido personalizado para ${state}. Las leyes estatales cambian con frecuencia. Consulte siempre con un abogado local antes de usar cualquier documento legal.`
      : `\n\n=== ${state.toUpperCase()} STATE-SPECIFIC NOTES ===\n${notes[state]}\n\nDISCLAIMER: This document has been customized for ${state}. State laws change frequently. Always consult a local attorney before using any legal document.`;
  }

  // State-specific modifications
  if (documentType === 'last-will-testament') {
    if (state === 'Louisiana') {
      template = template.replace(
        'WITNESSES:',
        'NOTARIZATION REQUIRED:\nThis will must be executed before a notary public in Louisiana.\n\nWITNESSES (if attested will):'
      );
    } else if (state === 'California' || state === 'Florida') {
      template = template.replace(
        'WITNESSES:',
        `WITNESSES (${state} requires two witnesses):`
      );
    }
  }

  if (documentType === 'residential-lease' && state) {
    const leaseAddendums: Record<string, string> = {
      'Alabama': 'ALABAMA ADDENDUM (Ala. Code §35-9A):\n- Security deposit limited to 1 month\'s rent; must be returned within 35 days\n- 7-day written notice required for non-payment of rent before eviction\n- Landlord must maintain premises in habitable condition per §35-9A-204',
      'Alaska': 'ALASKA ADDENDUM (AS §34.03):\n- Security deposit limited to 2 months rent; must be returned within 14 days\n- 7-day notice required for non-payment; 10-day notice for other violations\n- Landlord must give 24 hours notice before entry except in emergencies',
      'Arizona': 'ARIZONA ADDENDUM (A.R.S. §33-1301):\n- Security deposit limited to 1.5 months rent; must be returned within 14 business days\n- 5-day notice for non-payment of rent\n- Landlord must maintain premises per §33-1324 habitability standards',
      'Arkansas': 'ARKANSAS ADDENDUM (Ark. Code §18-16):\n- Security deposit must be returned within 60 days with written itemization\n- 3-day written notice required for non-payment before eviction\n- No implied warranty of habitability under Arkansas law',
      'California': 'CALIFORNIA ADDENDUM (Cal. Civil Code §1940 et seq.):\n- Security deposits limited to 2 months rent (unfurnished); must be returned within 21 days\n- 3-day notice for non-payment of rent; 30-60 days for no-fault termination\n- Landlord must disclose: mold, death on property within 3 years, lead-based paint (pre-1978)\n- Rent control may apply in: Los Angeles, San Francisco, Oakland, San Jose, and other cities\n- California AB 1482 caps annual rent increases at 5% + CPI for covered units\n- Electronic signatures are valid and enforceable under Cal. Civil Code §1633.7',
      'Colorado': 'COLORADO ADDENDUM (C.R.S. §38-12):\n- Security deposit must be returned within 1 month (up to 60 days per lease)\n- 10-day notice for non-payment; 3-day cure period for other violations\n- Late fees may not exceed $50 or 5% of monthly rent per 2024 law\n- Landlord must disclose radon levels and presence of bedbugs',
      'Connecticut': 'CONNECTICUT ADDENDUM (C.G.S. §47a):\n- Security deposit limited to 2 months rent (1 month if tenant is 62+)\n- Must be returned within 30 days; interest required after 6 months\n- 15-day notice for non-payment after grace period',
      'Delaware': 'DELAWARE ADDENDUM (25 Del. C. §5101):\n- Security deposit limited to 1 month rent after first year; must be returned within 20 days\n- 5-day notice for non-payment of rent\n- Landlord must maintain habitable conditions per §5314',
      'Florida': 'FLORIDA ADDENDUM (Fla. Stat. Chapter 83):\n- Security deposit must be held in a Florida financial institution; returned within 15-30 days\n- 3-day notice for non-payment; 7-day notice for material violations\n- Mandatory mold disclosure; radon disclosure required by §404.056\n- Landlord must provide 12 hours notice before entry except for emergencies\n- Electronic records and signatures are valid under Fla. Stat. §668.001\n- Exclusive jurisdiction: state courts of the county where the Premises are located, State of Florida',
      'Georgia': 'GEORGIA ADDENDUM (O.C.G.A. §44-7):\n- Security deposit must be returned within 30 days with itemized deductions\n- 30-day written notice required to terminate month-to-month tenancy\n- Dispossessory action (eviction) requires a formal court filing\n- Georgia does not cap security deposits by statute',
      'Hawaii': 'HAWAII ADDENDUM (Haw. Rev. Stat. §521):\n- Security deposit limited to 1 month rent; must be returned within 14 days\n- 5-day notice for non-payment; 10-day notice for material violations\n- Landlord may enter with 2 days written notice',
      'Idaho': 'IDAHO ADDENDUM (Idaho Code §6-320):\n- Security deposit must be returned within 21-30 days\n- 3-day notice for non-payment of rent\n- Landlord must maintain premises in habitable condition per §6-320(a)',
      'Illinois': 'ILLINOIS ADDENDUM:\n- Chicago RLTO applies within city limits and requires 30-day notice for termination\n- Security deposit interest required in municipalities over 25,000 residents\n- Deposit must be returned within 30 days; itemization required for deductions\n- 5-day notice for non-payment (3 days in Chicago)',
      'Indiana': 'INDIANA ADDENDUM (I.C. §32-31-3):\n- Security deposit must be returned within 45 days with itemized deductions\n- 10-day notice for non-payment of rent\n- No statutory interest on security deposits',
      'Iowa': 'IOWA ADDENDUM (Iowa Code §562A):\n- Security deposit limited to 2 months rent; must be returned within 30 days\n- 3-day notice for non-payment; 7-day cure period for other violations\n- Landlord must provide written receipts for all cash payments',
      'Kansas': 'KANSAS ADDENDUM (K.S.A. §58-2543):\n- Security deposit limited to 1 month rent (unfurnished) or 1.5 months (furnished)\n- Must be returned within 14-30 days with itemization\n- 3-day notice for non-payment of rent',
      'Kentucky': 'KENTUCKY ADDENDUM (K.R.S. §383):\n- Security deposit must be returned within 30-60 days\n- 7-day notice for non-payment; 14-day notice for material violations\n- Landlord must disclose name and address of property manager',
      'Louisiana': 'LOUISIANA ADDENDUM (La. Civil Code):\n- Security deposit must be returned within 1 month with itemization\n- 5-day notice for non-payment of rent\n- No statutory cap on security deposits\n- Louisiana law follows Civil Code concepts distinct from common law',
      'Maine': 'MAINE ADDENDUM (14 M.R.S.A. §6001):\n- Security deposit limited to 2 months rent; must be returned within 21-30 days\n- 7-day notice for non-payment; 30-day notice to terminate tenancy at will\n- Landlord must maintain premises to legal standards of fitness for human habitation',
      'Maryland': 'MARYLAND ADDENDUM (Md. Code, Real Prop. §8-203):\n- Security deposit limited to 2 months rent; must be returned within 45 days\n- Deposit must be held in an insured interest-bearing account\n- 30-day notice for non-payment\n- Lead paint disclosure mandatory for pre-1978 properties',
      'Massachusetts': 'MASSACHUSETTS ADDENDUM (M.G.L. Ch.186):\n- Security deposit limited to 1 month rent; must be returned within 30 days\n- Landlord must pay annual interest on security deposits held more than 1 year\n- 14-day notice for non-payment of rent\n- Landlord must provide separate "last month\'s rent" and security deposit receipts',
      'Michigan': 'MICHIGAN ADDENDUM (M.C.L. §554.601):\n- Security deposit limited to 1.5 months rent; must be returned within 30 days\n- 7-day demand for possession for non-payment\n- Landlord must inventory and itemize premises condition at move-in',
      'Minnesota': 'MINNESOTA ADDENDUM (Minn. Stat. §504B):\n- No statutory cap on security deposit; must be returned within 21 days\n- Landlord must pay annual interest on deposits (3% for 2024)\n- 14-day notice for non-payment of rent\n- Landlord must disclose material facts affecting habitability',
      'Mississippi': 'MISSISSIPPI ADDENDUM (Miss. Code §89-8):\n- Security deposit must be returned within 45 days with itemized deductions\n- 3-day notice for non-payment of rent\n- No statutory cap on security deposits; no interest requirement',
      'Missouri': 'MISSOURI ADDENDUM (Mo. Rev. Stat. §535):\n- Security deposit limited to 2 months rent; must be returned within 30 days\n- No-payment notice period: consult local court rules\n- St. Louis and Kansas City may have additional ordinances',
      'Montana': 'MONTANA ADDENDUM (Mont. Code §70-25):\n- Security deposit must be returned within 30 days (10 days if no damage)\n- 3-day notice for non-payment of rent; 14-day notice for other violations\n- Landlord must maintain the premises in habitable condition',
      'Nebraska': 'NEBRASKA ADDENDUM (Neb. Rev. Stat. §76-1401):\n- Security deposit limited to 1 month rent; must be returned within 14 days\n- 3-day notice for non-payment of rent\n- Landlord must disclose mold knowledge and any previous flooding',
      'Nevada': 'NEVADA ADDENDUM (Nev. Rev. Stat. Chapter 118A):\n- Security deposit limited to 3 months rent; must be returned within 30 days\n- 7-day notice for non-payment; 5-day notice for lease violations\n- Las Vegas and Clark County have additional tenant protections',
      'New Hampshire': 'NEW HAMPSHIRE ADDENDUM (N.H. Rev. Stat. §540-A):\n- Security deposit limited to 1 month rent or $100 (whichever is greater)\n- Must be returned within 30 days (14 days if no damage)\n- 7-day notice for non-payment of rent',
      'New Jersey': 'NEW JERSEY ADDENDUM (N.J.S.A. §46:8-19):\n- Security deposit limited to 1.5 months rent; must be returned within 30 days\n- Landlord must pay annual interest on deposits held more than 1 year\n- Good cause eviction required for most residential leases\n- 30-day notice required for rent increase',
      'New Mexico': 'NEW MEXICO ADDENDUM (N.M. Stat. §47-8):\n- Security deposit limited to 1 month rent (for leases under 1 year)\n- Must be returned within 30 days; interest required if held more than 1 year\n- 3-day notice for non-payment of rent',
      'New York': 'NEW YORK ADDENDUM (Real Prop. Law and HSTPA 2019):\n- Security deposits limited to 1 month rent statewide\n- Must be returned within 14 days of move-out with itemized statement\n- NYC Rent Stabilization and Rent Control apply to certain units\n- Landlord must inspect premises and notify tenant of conditions prior to move-out\n- 14-day notice for non-payment; 90-day notice to terminate fixed-term lease\n- Lead paint disclosure required for pre-1978 buildings\n- Electronic signatures are valid under N.Y. ETSA',
      'North Carolina': 'NORTH CAROLINA ADDENDUM (N.C.G.S. §42):\n- Security deposit limited to 1.5 months rent (month-to-month) or 2 months (term lease)\n- Must be returned within 30 days; interest optional\n- 10-day notice for non-payment of rent\n- Small claims court handles disputes under $10,000',
      'North Dakota': 'NORTH DAKOTA ADDENDUM (N.D.C.C. §47-16):\n- Security deposit limited to 1 month rent; must be returned within 30 days\n- 3-day notice for non-payment of rent\n- Landlord must inspect premises within 3 days of move-out',
      'Ohio': 'OHIO ADDENDUM (O.R.C. §5321):\n- No statutory cap; landlord must pay 5% annual interest on deposits over $50\n- Security deposit must be returned within 30 days with itemization\n- 3-day notice for non-payment of rent\n- Landlord must maintain premises per §5321.02 habitability standards',
      'Oklahoma': 'OKLAHOMA ADDENDUM (Okla. Stat. §41-101):\n- Security deposit must be returned within 45 days\n- 5-day notice for non-payment of rent\n- Landlord must disclose name and address of all property managers',
      'Oregon': 'OREGON ADDENDUM (O.R.S. Chapter 90):\n- No statutory limit on security deposit; must be returned within 31 days\n- 72-hour notice for non-payment of rent (144-hour notice with 6-day grace period)\n- Portland Relocation Assistance Ordinance may apply in Portland\n- Landlord must provide written move-in checklist within 7 days of occupancy',
      'Pennsylvania': 'PENNSYLVANIA ADDENDUM (68 P.S. §250.101):\n- Security deposit limited to 2 months rent first year; 1 month thereafter\n- Must be returned within 30 days with itemized list of deductions\n- 10-day notice for non-payment of rent\n- Philadelphia Fair Practices Ordinance adds additional tenant protections in Philadelphia',
      'Rhode Island': 'RHODE ISLAND ADDENDUM (R.I. Gen. Laws §34-18):\n- Security deposit limited to 1 month rent; must be returned within 20 days\n- 5-day notice for non-payment of rent\n- Landlord must obtain certificate of habitability for newly constructed units',
      'South Carolina': 'SOUTH CAROLINA ADDENDUM (S.C. Code §27-40):\n- No statutory limit on security deposit; must be returned within 30 days\n- 5-day notice for non-payment of rent\n- Landlord must maintain habitable conditions under §27-40-440',
      'South Dakota': 'SOUTH DAKOTA ADDENDUM (S.D.C.L. §43-32):\n- Security deposit limited to 1 month rent; must be returned within 14 days (2 weeks)\n- 3-day notice for non-payment of rent\n- Landlord and Tenant rights and obligations interpreted under South Dakota landlord-tenant law\n- Any legal action arising from this Lease shall be brought in the state courts of the county where the Premises are located, State of South Dakota\n- Electronic signatures and records are valid, admissible, and enforceable under the E-SIGN Act and applicable South Dakota law',
      'Tennessee': 'TENNESSEE ADDENDUM (T.C.A. §66-28):\n- No statutory limit on security deposit; must be returned within 30 days\n- 14-day notice for non-payment of rent\n- Landlord must provide smoke and carbon monoxide detectors per state fire code',
      'Texas': 'TEXAS ADDENDUM (Tex. Prop. Code Chapter 92):\n- No statutory cap on security deposit; must be returned within 30 days\n- No statewide rent control; landlord may set late fees\n- 3-day notice to vacate for non-payment before filing eviction suit\n- Landlord must provide smoke alarms, deadbolt locks, and security devices per §92.153\n- Required disclosures: lead paint (pre-1978), flooding history per HB 531',
      'Utah': 'UTAH ADDENDUM (Utah Code §57-22):\n- No statutory cap; security deposit must be returned within 30 days\n- 3-day notice for non-payment of rent\n- Landlord must disclose mold and any ongoing litigation related to property',
      'Vermont': 'VERMONT ADDENDUM (9 V.S.A. §4461):\n- No statutory limit; deposit must be returned within 14 days\n- 14-day notice for non-payment of rent (7 days with second notice)\n- Landlord must pay interest on deposits held more than 1 year\n- Lead disclosure required for pre-1978 buildings',
      'Virginia': 'VIRGINIA ADDENDUM (Va. Code §55.1-1200 VRLTA):\n- Security deposit limited to 2 months rent; must be returned within 45 days\n- 14-day pay or quit notice for non-payment of rent\n- Landlord must provide written statement of move-in inspection within 5 days\n- Virginia VRLTA applies to all residential rental agreements',
      'Washington': 'WASHINGTON ADDENDUM (RCW Chapter 59.18):\n- No statutory cap; deposit must be returned within 21 days with itemized statement\n- 14-day pay or vacate notice for non-payment of rent (2022 law)\n- Move-in checklist required; landlord must give receipts for deposits\n- Seattle and other cities have Just Cause Eviction Ordinances\n- Landlord must provide notice before entering premises (48 hours minimum)',
      'West Virginia': 'WEST VIRGINIA ADDENDUM (W. Va. Code §37-6):\n- No statutory cap; deposit must be returned within 60 days\n- 7-day notice for non-payment of rent\n- Landlord must maintain premises in reasonably habitable condition',
      'Wisconsin': 'WISCONSIN ADDENDUM (Wis. Stat. §704):\n- No statutory cap on security deposit; must be returned within 21 days\n- 5-day notice for non-payment of rent; 5-day cure period for other violations\n- Landlord must provide Landlord-Tenant Law brochure at lease signing\n- Milwaukee has additional local tenant protection ordinances',
      'Wyoming': 'WYOMING ADDENDUM (Wyo. Stat. §1-21-1203):\n- No statutory cap; deposit must be returned within 30 days (15 days if no damage)\n- 3-day notice for non-payment of rent\n- No statewide rent control; no required warranty of habitability by statute',
    };

    const addendum = leaseAddendums[state];
    if (addendum) {
      template += `\n\n${'='.repeat(70)}\n${addendum}\n\nDISCLAIMER: This document has been customized for the State of ${state}. State landlord-tenant laws change frequently. Always consult a licensed local attorney before executing any residential lease agreement.\n${'='.repeat(70)}`;
    } else if (state) {
      template += `\n\n${'='.repeat(70)}\n${state.toUpperCase()} STATE ADDENDUM:\nThis Lease Agreement shall be governed by and construed in accordance with the laws of the State of ${state}. Any legal action arising from this Agreement shall be brought in the appropriate courts of ${state}. Electronic signatures are valid and enforceable under the US Federal ESIGN Act.\n${'='.repeat(70)}`;
    }
  }

  if (documentType === 'eviction-notice') {
    if (state === 'California') {
      template = template.replace(
        'You must vacate the premises within {{cure_period}} days',
        'You have 3 days to pay rent or vacate (for non-payment), or 30-60 days for no-fault eviction under California law'
      );
    } else if (state === 'Florida') {
      template = template.replace(
        'You must vacate the premises within {{cure_period}} days',
        'You have 3 days to pay rent and vacate the premises (Florida Statutes 83.56)'
      );
    }
  }

  return template;
}

// Spanish state names (for bilingual interface)
export const STATE_NAMES_ES: Record<string, string> = {
  'Alabama': 'Alabama',
  'Alaska': 'Alaska',
  'Arizona': 'Arizona',
  'Arkansas': 'Arkansas',
  'California': 'California',
  'Colorado': 'Colorado',
  'Connecticut': 'Connecticut',
  'Delaware': 'Delaware',
  'Florida': 'Florida',
  'Georgia': 'Georgia',
  'Hawaii': 'Hawái',
  'Idaho': 'Idaho',
  'Illinois': 'Illinois',
  'Indiana': 'Indiana',
  'Iowa': 'Iowa',
  'Kansas': 'Kansas',
  'Kentucky': 'Kentucky',
  'Louisiana': 'Luisiana',
  'Maine': 'Maine',
  'Maryland': 'Maryland',
  'Massachusetts': 'Massachusetts',
  'Michigan': 'Míchigan',
  'Minnesota': 'Minnesota',
  'Mississippi': 'Misisipi',
  'Missouri': 'Misuri',
  'Montana': 'Montana',
  'Nebraska': 'Nebraska',
  'Nevada': 'Nevada',
  'New Hampshire': 'Nuevo Hampshire',
  'New Jersey': 'Nueva Jersey',
  'New Mexico': 'Nuevo México',
  'New York': 'Nueva York',
  'North Carolina': 'Carolina del Norte',
  'North Dakota': 'Dakota del Norte',
  'Ohio': 'Ohio',
  'Oklahoma': 'Oklahoma',
  'Oregon': 'Oregón',
  'Pennsylvania': 'Pensilvania',
  'Rhode Island': 'Rhode Island',
  'South Carolina': 'Carolina del Sur',
  'South Dakota': 'Dakota del Sur',
  'Tennessee': 'Tennessee',
  'Texas': 'Texas',
  'Utah': 'Utah',
  'Vermont': 'Vermont',
  'Virginia': 'Virginia',
  'Washington': 'Washington',
  'West Virginia': 'Virginia Occidental',
  'Wisconsin': 'Wisconsin',
  'Wyoming': 'Wyoming',
};
