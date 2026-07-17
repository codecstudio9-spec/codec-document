// Document-type × state combination pages (NDA-California, Lease-Texas,
// etc.) — the natural next layer below the 6 state hub pages
// (state-seo-content.ts): those target "legal documents in [state]"
// intent, these target "[document] in [state]" intent, a different and
// generally higher-converting search query. Real per-combination legal
// facts (not a find-and-replace) keep each page differentiated.

export interface DocTypeState {
  docType: 'nda' | 'lease-agreement';
  docTypeLabelEn: string;
  docTypeLabelEs: string;
  generatorPath: string;
  stateSlug: string;
  stateName: string;
  stateNameEs: string;
  stateAbbr: string;
  facts: Array<{ en: string; es: string }>;
  faqEn: string;
  faqEs: string;
  faqAnswerEn: string;
  faqAnswerEs: string;
}

const STATES = [
  { slug: 'california', name: 'California', nameEs: 'California', abbr: 'CA' },
  { slug: 'texas', name: 'Texas', nameEs: 'Texas', abbr: 'TX' },
  { slug: 'florida', name: 'Florida', nameEs: 'Florida', abbr: 'FL' },
  { slug: 'new-york', name: 'New York', nameEs: 'Nueva York', abbr: 'NY' },
  { slug: 'illinois', name: 'Illinois', nameEs: 'Illinois', abbr: 'IL' },
  { slug: 'pennsylvania', name: 'Pennsylvania', nameEs: 'Pensilvania', abbr: 'PA' },
] as const;

const NDA_FACTS: Record<string, Array<{ en: string; es: string }>> = {
  california: [
    { en: 'Non-compete clauses are void under Cal. Bus. & Prof. Code §16600, but confidentiality terms remain fully enforceable — California NDAs should focus on protecting trade secrets, not restricting competition.', es: 'Las cláusulas de no competencia son nulas bajo el Código de Negocios y Profesiones de California §16600, pero los términos de confidencialidad siguen siendo totalmente exigibles — los NDA de California deben enfocarse en proteger secretos comerciales, no en restringir la competencia.' },
    { en: 'California adopted the Uniform Trade Secrets Act (Cal. Civil Code §3426 et seq.), giving trade secret owners the right to injunctive relief and damages for misappropriation.', es: 'California adoptó la Ley Uniforme de Secretos Comerciales (Código Civil §3426 y siguientes), otorgando al dueño del secreto comercial el derecho a medidas cautelares e indemnización por apropiación indebida.' },
    { en: 'Since 2019 reforms, California NDAs cannot be used to silence claims of workplace harassment or discrimination — a mandatory carve-out is required.', es: 'Desde las reformas de 2019, los NDA de California no pueden usarse para silenciar denuncias de acoso o discriminación laboral — se requiere una excepción obligatoria.' },
  ],
  texas: [
    { en: 'Texas adopted the Texas Uniform Trade Secrets Act (Tex. Civ. Prac. & Rem. Code Ch. 134A), covering misappropriation remedies and injunctive relief.', es: 'Texas adoptó la Ley Uniforme de Secretos Comerciales de Texas (Código de Práctica Civil y Recursos, Cap. 134A), que cubre recursos por apropiación indebida y medidas cautelares.' },
    { en: 'Unlike California, Texas generally enforces reasonable non-compete and non-solicit clauses bundled into an NDA if limited in time, geography, and scope (Tex. Bus. & Com. Code §15.50).', es: 'A diferencia de California, Texas generalmente hace cumplir las cláusulas razonables de no competencia y no solicitud incluidas en un NDA si están limitadas en tiempo, geografía y alcance (Código de Negocios y Comercio §15.50).' },
    { en: 'No state income tax and business-friendly courts make Texas a popular choice for the governing-law clause in multi-state NDAs.', es: 'La ausencia de impuesto estatal sobre la renta y los tribunales favorables a los negocios hacen de Texas una jurisdicción popular para la cláusula de ley aplicable en NDA multiestatales.' },
  ],
  florida: [
    { en: 'Florida adopted the Uniform Trade Secrets Act (Fla. Stat. §688.001 et seq.), covering misappropriation claims and remedies.', es: 'Florida adoptó la Ley Uniforme de Secretos Comerciales (Estatuto §688.001 y siguientes), que cubre reclamos y recursos por apropiación indebida.' },
    { en: 'Florida is one of the most employer-friendly states for restrictive covenants — non-compete terms up to 2 years are presumed reasonable for former employees (Fla. Stat. §542.335) and are often bundled into NDAs.', es: 'Florida es uno de los estados más favorables al empleador en cuanto a pactos restrictivos — los términos de no competencia de hasta 2 años se presumen razonables para exempleados (Estatuto §542.335) y suelen incluirse en los NDA.' },
    { en: 'Electronic signatures on NDAs are explicitly valid under Florida\'s Electronic Signature Act (Fla. Stat. §668.001).', es: 'Las firmas electrónicas en los NDA son explícitamente válidas bajo la Ley de Firma Electrónica de Florida (Estatuto §668.001).' },
  ],
  'new-york': [
    { en: 'New York has NOT adopted the Uniform Trade Secrets Act — trade secret protection relies on common law developed through case law rather than a single statute.', es: 'Nueva York NO ha adoptado la Ley Uniforme de Secretos Comerciales — la protección de secretos comerciales se basa en el derecho consuetudinario desarrollado a través de jurisprudencia en lugar de un solo estatuto.' },
    { en: 'New York courts closely scrutinize non-compete clauses bundled into NDAs, generally requiring they be reasonable in time and geography and necessary to protect a legitimate business interest.', es: 'Los tribunales de Nueva York examinan de cerca las cláusulas de no competencia incluidas en los NDA, generalmente exigiendo que sean razonables en tiempo y geografía y necesarias para proteger un interés comercial legítimo.' },
    { en: 'A 2018 New York State law prohibits NDAs from concealing sexual harassment claims unless the confidentiality provision is the employee\'s documented preference.', es: 'Una ley estatal de Nueva York de 2018 prohíbe que los NDA oculten denuncias de acoso sexual a menos que la cláusula de confidencialidad sea la preferencia documentada del empleado.' },
  ],
  illinois: [
    { en: 'Illinois adopted the Illinois Trade Secrets Act (765 ILCS 1065), which governs misappropriation claims and available remedies.', es: 'Illinois adoptó la Ley de Secretos Comerciales de Illinois (765 ILCS 1065), que rige los reclamos por apropiación indebida y los recursos disponibles.' },
    { en: 'The Illinois Freedom to Work Act restricts non-compete clauses for lower-wage employees — NDAs bundled with non-competes must account for this earnings threshold.', es: 'La Ley de Libertad para Trabajar de Illinois restringe las cláusulas de no competencia para empleados de menores ingresos — los NDA que incluyen cláusulas de no competencia deben considerar este umbral salarial.' },
    { en: 'Illinois courts require the definition of "confidential information" in an NDA to be specific — overly broad definitions risk being found unenforceable.', es: 'Los tribunales de Illinois exigen que la definición de "información confidencial" en un NDA sea específica — las definiciones demasiado amplias corren el riesgo de ser declaradas inexigibles.' },
  ],
  pennsylvania: [
    { en: 'Pennsylvania adopted the Uniform Trade Secrets Act (12 Pa. C.S. §5301 et seq.), covering misappropriation remedies.', es: 'Pensilvania adoptó la Ley Uniforme de Secretos Comerciales (12 Pa. C.S. §5301 y siguientes), que cubre recursos por apropiación indebida.' },
    { en: 'Pennsylvania courts require "new consideration" (such as a raise or bonus) for a non-compete or restrictive NDA clause signed after employment has already begun.', es: 'Los tribunales de Pensilvania exigen una "nueva contraprestación" (como un aumento o bono) para una cláusula de no competencia o NDA restrictivo firmado después de que ya inició la relación laboral.' },
    { en: 'Electronic signatures on NDAs are valid under Pennsylvania\'s Electronic Transactions Act (73 P.S. §2260.101).', es: 'Las firmas electrónicas en los NDA son válidas bajo la Ley de Transacciones Electrónicas de Pensilvania (73 P.S. §2260.101).' },
  ],
};

const LEASE_FACTS: Record<string, Array<{ en: string; es: string }>> = {
  california: [
    { en: 'Security deposits are capped at 2 months\' rent (unfurnished) under Cal. Civil Code §1940 et seq., and must be returned within 21 days of move-out.', es: 'Los depósitos de garantía están limitados a 2 meses de renta (sin amueblar) bajo el Código Civil §1940 y siguientes, y deben devolverse en 21 días tras la mudanza.' },
    { en: 'Rent control applies in Los Angeles, San Francisco, Oakland, San Jose and other cities; statewide, AB 1482 caps annual increases at 5% + CPI for covered units.', es: 'El control de alquiler aplica en Los Ángeles, San Francisco, Oakland, San José y otras ciudades; a nivel estatal, AB 1482 limita los aumentos anuales a 5% + IPC para unidades cubiertas.' },
    { en: 'Mandatory disclosures include mold, any death on the property within the last 3 years, and lead-based paint for buildings constructed before 1978.', es: 'Las divulgaciones obligatorias incluyen moho, cualquier fallecimiento en la propiedad en los últimos 3 años, y pintura con plomo para edificios construidos antes de 1978.' },
  ],
  texas: [
    { en: 'Texas Property Code Chapter 92 sets no statutory cap on security deposits; landlords must return the deposit within 30 days with itemized deductions.', es: 'El Código de Propiedad de Texas, Capítulo 92, no fija un límite legal para depósitos de garantía; el arrendador debe devolverlo en 30 días con deducciones detalladas.' },
    { en: 'There is no statewide rent control, and self-help eviction (changing locks, removing belongings) is illegal — evictions must go through Justice Court with a 3-day notice to vacate.', es: 'No existe control de alquiler estatal, y el desalojo por mano propia (cambiar cerraduras, retirar pertenencias) es ilegal — los desalojos deben pasar por la Corte de Justicia con un aviso de 3 días para desocupar.' },
    { en: 'Landlords must provide smoke alarms, deadbolt locks, and security devices per Tex. Prop. Code §92.153, and disclose known flooding history under HB 531.', es: 'Los arrendadores deben proveer detectores de humo, cerraduras de seguridad y dispositivos de seguridad según el Código de Propiedad §92.153, y divulgar historial de inundaciones conocido bajo HB 531.' },
  ],
  florida: [
    { en: 'Florida Statutes Chapter 83 requires security deposits to be held in a Florida financial institution and returned within 15 days (30 days if claiming deductions).', es: 'El Capítulo 83 de los Estatutos de Florida exige que los depósitos de garantía se mantengan en una institución financiera de Florida y se devuelvan en 15 días (30 días si se reclaman deducciones).' },
    { en: 'Mandatory mold and radon disclosures apply statewide (Fla. Stat. §404.056), and landlords must give 12 hours\' notice before entry except in emergencies.', es: 'Las divulgaciones obligatorias de moho y radón aplican en todo el estado (Estatuto §404.056), y los arrendadores deben avisar con 12 horas de anticipación antes de ingresar, salvo emergencias.' },
    { en: 'A 3-day notice is required for non-payment of rent, and a 7-day notice for material lease violations, before an eviction case can proceed.', es: 'Se requiere un aviso de 3 días por falta de pago de renta, y de 7 días por violaciones materiales al contrato, antes de que un caso de desalojo pueda proceder.' },
  ],
  'new-york': [
    { en: 'Since the 2019 HSTPA reform, security deposits are capped at 1 month\'s rent statewide and must be returned within 14 days of move-out with an itemized statement.', es: 'Desde la reforma HSTPA de 2019, los depósitos de garantía están limitados a 1 mes de renta en todo el estado y deben devolverse en 14 días tras la mudanza con un estado de cuenta detallado.' },
    { en: 'NYC has additional rent stabilization and rent control rules on top of statewide protections — always confirm whether a unit is regulated before drafting.', es: 'NYC tiene reglas adicionales de estabilización y control de renta sobre las protecciones estatales — siempre confirma si una unidad está regulada antes de redactar el contrato.' },
    { en: 'Landlords must inspect the unit and notify the tenant of move-out conditions in advance, and pre-1978 buildings require lead paint disclosure.', es: 'Los arrendadores deben inspeccionar la unidad y notificar al inquilino de las condiciones de salida con anticipación, y los edificios anteriores a 1978 requieren divulgación de pintura con plomo.' },
  ],
  illinois: [
    { en: 'Chicago\'s Residential Landlord Tenant Ordinance (RLTO) requires security deposit interest in buildings with 6+ units and adds protections beyond state law.', es: 'La Ordenanza de Arrendador-Inquilino Residencial de Chicago (RLTO) exige interés sobre el depósito en edificios con 6 o más unidades y agrega protecciones más allá de la ley estatal.' },
    { en: 'A 5-day notice for non-payment of rent applies in Chicago (10-day notice for lease violations statewide) before an eviction case can be filed.', es: 'En Chicago aplica un aviso de 5 días por falta de pago de renta (aviso de 10 días por violaciones al contrato en todo el estado) antes de poder presentar un caso de desalojo.' },
    { en: 'Deposits must be returned within 30 days with itemization for any deductions, statewide.', es: 'Los depósitos deben devolverse en 30 días con detalle de cualquier deducción, en todo el estado.' },
  ],
  pennsylvania: [
    { en: 'Pennsylvania\'s Landlord-Tenant Act caps security deposits at 2 months\' rent for the first year of tenancy, dropping to 1 month thereafter.', es: 'La Ley de Arrendador-Inquilino de Pensilvania limita los depósitos de garantía a 2 meses de renta el primer año de arrendamiento, bajando a 1 mes después.' },
    { en: 'Deposits must be returned within 30 days with an itemized list of deductions, and a 10-day notice is required for non-payment of rent.', es: 'Los depósitos deben devolverse en 30 días con una lista detallada de deducciones, y se requiere un aviso de 10 días por falta de pago de renta.' },
    { en: 'Philadelphia\'s Fair Practices Ordinance adds tenant protections beyond state law — leases used within city limits should account for these local rules.', es: 'La Ordenanza de Prácticas Justas de Filadelfia agrega protecciones para inquilinos más allá de la ley estatal — los contratos usados dentro de los límites de la ciudad deben considerar estas reglas locales.' },
  ],
};

const NDA_FAQ: Record<string, { qEn: string; qEs: string; aEn: string; aEs: string }> = {
  california: { qEn: 'Are non-compete clauses enforceable in a California NDA?', qEs: '¿Son exigibles las cláusulas de no competencia en un NDA de California?', aEn: 'No — California voids non-compete clauses under Bus. & Prof. Code §16600, even inside an NDA. The confidentiality obligations themselves remain fully enforceable; just don\'t rely on an NDA to restrict where someone can work next.', aEs: 'No — California anula las cláusulas de no competencia bajo el Código de Negocios y Profesiones §16600, incluso dentro de un NDA. Las obligaciones de confidencialidad en sí siguen siendo totalmente exigibles; solo no dependas de un NDA para restringir dónde puede trabajar alguien después.' },
  texas: { qEn: 'Can a Texas NDA include a non-compete clause?', qEs: '¿Puede un NDA de Texas incluir una cláusula de no competencia?', aEn: 'Yes. Texas generally enforces non-compete and non-solicit clauses bundled into an NDA as long as they\'re reasonable in duration, geographic area, and scope of activity restrained (Tex. Bus. & Com. Code §15.50).', aEs: 'Sí. Texas generalmente hace cumplir las cláusulas de no competencia y no solicitud incluidas en un NDA siempre que sean razonables en duración, área geográfica y alcance de la actividad restringida (Código de Negocios y Comercio §15.50).' },
  florida: { qEn: 'How long can a non-compete clause last in a Florida NDA?', qEs: '¿Cuánto puede durar una cláusula de no competencia en un NDA de Florida?', aEn: 'Florida presumes non-compete terms of up to 2 years reasonable for former employees under Fla. Stat. §542.335, making it one of the more employer-friendly states for restrictive covenants bundled into an NDA.', aEs: 'Florida presume razonables los términos de no competencia de hasta 2 años para exempleados bajo el Estatuto §542.335, lo que lo convierte en uno de los estados más favorables al empleador para pactos restrictivos incluidos en un NDA.' },
  'new-york': { qEn: 'Does New York have a trade secrets statute?', qEs: '¿Tiene Nueva York una ley de secretos comerciales?', aEn: 'No — New York is one of the few states that has not adopted the Uniform Trade Secrets Act. Trade secret protection there relies on common law developed through case law, which makes precise contract drafting in an NDA especially important.', aEs: 'No — Nueva York es uno de los pocos estados que no ha adoptado la Ley Uniforme de Secretos Comerciales. La protección de secretos comerciales ahí se basa en el derecho consuetudinario desarrollado por jurisprudencia, lo que hace especialmente importante una redacción precisa del contrato en el NDA.' },
  illinois: { qEn: 'Can an Illinois NDA restrict a lower-wage employee from working elsewhere?', qEs: '¿Puede un NDA de Illinois restringir a un empleado de menores ingresos de trabajar en otro lugar?', aEn: 'Generally no. The Illinois Freedom to Work Act bars non-compete clauses for employees earning below a statutory threshold — confidentiality terms in the NDA remain enforceable, but restrictive covenants for lower earners typically are not.', aEs: 'Generalmente no. La Ley de Libertad para Trabajar de Illinois prohíbe las cláusulas de no competencia para empleados que ganan por debajo de un umbral legal — los términos de confidencialidad del NDA siguen siendo exigibles, pero los pactos restrictivos para quienes ganan menos generalmente no lo son.' },
  pennsylvania: { qEn: 'Does a Pennsylvania NDA need something extra if signed after hiring?', qEs: '¿Necesita algo adicional un NDA de Pensilvania si se firma después de la contratación?', aEn: 'Yes. Pennsylvania courts require "new consideration" — such as a raise, bonus, or promotion — for a non-compete or restrictive NDA clause signed after employment has already started, or the restrictive terms may not be enforceable.', aEs: 'Sí. Los tribunales de Pensilvania exigen una "nueva contraprestación" — como un aumento, bono o ascenso — para una cláusula de no competencia o NDA restrictivo firmado después de que ya inició la relación laboral, o los términos restrictivos podrían no ser exigibles.' },
};

const LEASE_FAQ: Record<string, { qEn: string; qEs: string; aEn: string; aEs: string }> = {
  california: { qEn: 'How much can a landlord charge for a security deposit in California?', qEs: '¿Cuánto puede cobrar un arrendador por depósito de garantía en California?', aEn: 'Up to 2 months\' rent for an unfurnished unit under Cal. Civil Code §1940 et seq. The deposit must be returned within 21 days of move-out, and many cities (LA, SF, Oakland) add rent control on top of state law.', aEs: 'Hasta 2 meses de renta para una unidad sin amueblar bajo el Código Civil §1940 y siguientes. El depósito debe devolverse en 21 días tras la mudanza, y muchas ciudades (LA, SF, Oakland) agregan control de alquiler sobre la ley estatal.' },
  texas: { qEn: 'Is there a limit on security deposits in Texas?', qEs: '¿Hay un límite para los depósitos de garantía en Texas?', aEn: 'No — Texas Property Code Chapter 92 sets no statutory cap on security deposits, but landlords must return the deposit within 30 days of move-out with an itemized list of any deductions.', aEs: 'No — el Código de Propiedad de Texas, Capítulo 92, no fija un límite legal para depósitos de garantía, pero el arrendador debe devolverlo en 30 días tras la mudanza con una lista detallada de cualquier deducción.' },
  florida: { qEn: 'Where must a Florida landlord keep the security deposit?', qEs: '¿Dónde debe mantener el arrendador el depósito de garantía en Florida?', aEn: 'In a Florida financial institution, per Fla. Stat. Chapter 83. The deposit must be returned within 15 days of move-out, or within 30 days with written notice if the landlord is claiming deductions.', aEs: 'En una institución financiera de Florida, según el Capítulo 83 de los Estatutos de Florida. El depósito debe devolverse en 15 días tras la mudanza, o en 30 días con aviso escrito si el arrendador reclama deducciones.' },
  'new-york': { qEn: 'How much can a New York landlord charge for a security deposit?', qEs: '¿Cuánto puede cobrar un arrendador de Nueva York por depósito de garantía?', aEn: 'Since the 2019 HSTPA reform, security deposits are capped at 1 month\'s rent statewide, and must be returned within 14 days of move-out with an itemized statement of any deductions.', aEs: 'Desde la reforma HSTPA de 2019, los depósitos de garantía están limitados a 1 mes de renta en todo el estado, y deben devolverse en 14 días tras la mudanza con un estado detallado de cualquier deducción.' },
  illinois: { qEn: 'Does Chicago have different lease rules than the rest of Illinois?', qEs: '¿Tiene Chicago reglas de arrendamiento distintas al resto de Illinois?', aEn: 'Yes. Chicago\'s Residential Landlord Tenant Ordinance (RLTO) adds protections beyond state law, including mandatory security deposit interest in buildings with 6 or more units and a shorter 5-day notice period for non-payment.', aEs: 'Sí. La Ordenanza de Arrendador-Inquilino Residencial de Chicago (RLTO) agrega protecciones más allá de la ley estatal, incluyendo interés obligatorio sobre el depósito en edificios con 6 o más unidades y un plazo de aviso más corto de 5 días por falta de pago.' },
  pennsylvania: { qEn: 'How much security deposit can a Pennsylvania landlord require?', qEs: '¿Cuánto depósito de garantía puede exigir un arrendador de Pensilvania?', aEn: 'Up to 2 months\' rent during the first year of tenancy, dropping to a maximum of 1 month\'s rent for every year after that, per Pennsylvania\'s Landlord-Tenant Act. The deposit must be returned within 30 days of move-out.', aEs: 'Hasta 2 meses de renta durante el primer año de arrendamiento, bajando a un máximo de 1 mes de renta cada año después, según la Ley de Arrendador-Inquilino de Pensilvania. El depósito debe devolverse en 30 días tras la mudanza.' },
};

export const DOCTYPE_STATE_CONFIGS: DocTypeState[] = STATES.flatMap((s) => {
  const ndaFaq = NDA_FAQ[s.slug];
  const leaseFaq = LEASE_FAQ[s.slug];
  return [
    {
      docType: 'nda' as const,
      docTypeLabelEn: 'NDA', docTypeLabelEs: 'NDA',
      generatorPath: '/generator/nda',
      stateSlug: s.slug, stateName: s.name, stateNameEs: s.nameEs, stateAbbr: s.abbr,
      facts: NDA_FACTS[s.slug],
      faqEn: ndaFaq.qEn, faqEs: ndaFaq.qEs, faqAnswerEn: ndaFaq.aEn, faqAnswerEs: ndaFaq.aEs,
    },
    {
      docType: 'lease-agreement' as const,
      docTypeLabelEn: 'Lease Agreement', docTypeLabelEs: 'Contrato de Arrendamiento',
      generatorPath: '/generator/residential-lease',
      stateSlug: s.slug, stateName: s.name, stateNameEs: s.nameEs, stateAbbr: s.abbr,
      facts: LEASE_FACTS[s.slug],
      faqEn: leaseFaq.qEn, faqEs: leaseFaq.qEs, faqAnswerEn: leaseFaq.aEn, faqAnswerEs: leaseFaq.aEs,
    },
  ];
});
