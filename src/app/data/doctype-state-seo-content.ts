// Document-type × state combination pages (NDA-California, Lease-Texas,
// etc.) — the natural next layer below the 6 state hub pages
// (state-seo-content.ts): those target "legal documents in [state]"
// intent, these target "[document] in [state]" intent, a different and
// generally higher-converting search query. Real per-combination legal
// facts (not a find-and-replace) keep each page differentiated.

export type DocType = 'nda' | 'lease-agreement' | 'independent-contractor' | 'service-agreement' | 'promissory-note' | 'vehicle-bill-of-sale';

export interface DocTypeState {
  docType: DocType;
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

// Worker classification (employee vs. independent contractor) is the
// single most consequential legal variable by state for this document —
// misclassification penalties are real and the tests differ sharply.
const CONTRACTOR_FACTS: Record<string, Array<{ en: string; es: string }>> = {
  california: [
    { en: 'California uses the strict "ABC test" under AB5 (Cal. Lab. Code §2775) — a worker is presumed an employee unless the hiring business proves all three prongs, making misclassification risk higher here than almost anywhere else.', es: 'California usa la estricta "prueba ABC" bajo AB5 (Código Laboral §2775) — se presume que un trabajador es empleado a menos que la empresa contratante demuestre los tres criterios, lo que hace el riesgo de mala clasificación más alto que en casi cualquier otro lugar.' },
    { en: 'Certain professions (doctors, lawyers, accountants, and some creative professionals) are exempt from the ABC test and use the older multi-factor "Borello" test instead.', es: 'Ciertas profesiones (médicos, abogados, contadores y algunos profesionales creativos) están exentas de la prueba ABC y usan en su lugar la antigua prueba de múltiples factores "Borello".' },
    { en: 'A written agreement stating "independent contractor" status alone does not control — California courts and agencies look at the actual working relationship.', es: 'Un acuerdo escrito que indique el estatus de "contratista independiente" por sí solo no determina el resultado — los tribunales y agencias de California examinan la relación de trabajo real.' },
  ],
  texas: [
    { en: 'Texas uses the common-law "right to control" test — no ABC test — generally making independent contractor status easier to establish than in California.', es: 'Texas usa la prueba de derecho común de "derecho a controlar" — sin prueba ABC — lo que generalmente hace más fácil establecer el estatus de contratista independiente que en California.' },
    { en: 'The Texas Workforce Commission weighs factors like who controls the schedule, tools, and method of work when a classification is disputed for unemployment tax purposes.', es: 'La Comisión de Fuerza Laboral de Texas pondera factores como quién controla el horario, las herramientas y el método de trabajo cuando se disputa una clasificación para fines de impuesto de desempleo.' },
    { en: 'No state income tax simplifies contractor payment structures compared to states that require state-level withholding considerations.', es: 'La ausencia de impuesto estatal sobre la renta simplifica las estructuras de pago a contratistas en comparación con estados que requieren consideraciones de retención a nivel estatal.' },
  ],
  florida: [
    { en: 'Florida uses a common-law multi-factor "right to control" test, with a specific statutory test under Fla. Stat. §440.02 used for workers\' compensation classification.', es: 'Florida usa una prueba de derecho común de múltiples factores de "derecho a controlar", con una prueba estatutaria específica bajo el Estatuto §440.02 usada para la clasificación de compensación laboral.' },
    { en: 'Construction industry contractors face extra scrutiny — Florida requires most construction subcontractors to carry their own workers\' comp coverage or be treated as employees.', es: 'Los contratistas de la industria de la construcción enfrentan mayor escrutinio — Florida exige que la mayoría de los subcontratistas de construcción tengan su propia cobertura de compensación laboral o sean tratados como empleados.' },
    { en: 'Electronic signatures on contractor agreements are explicitly valid under Fla. Stat. §668.001.', es: 'Las firmas electrónicas en acuerdos de contratista son explícitamente válidas bajo el Estatuto de Florida §668.001.' },
  ],
  'new-york': [
    { en: 'New York uses a common-law control test but enforces it aggressively, especially in construction: the Construction Industry Fair Play Act presumes construction workers are employees unless strict criteria are met.', es: 'Nueva York usa una prueba de control de derecho común pero la aplica de forma estricta, especialmente en construcción: la Ley de Juego Limpio en la Industria de la Construcción presume que los trabajadores de construcción son empleados a menos que se cumplan criterios estrictos.' },
    { en: 'A separate Commercial Goods Transportation Industry Fair Play Act applies a similar presumption to delivery and trucking contractors.', es: 'Una Ley de Juego Limpio en la Industria de Transporte de Bienes Comerciales separada aplica una presunción similar a contratistas de entrega y transporte.' },
    { en: 'Misclassification penalties in New York can include back unemployment insurance contributions plus fines — courts do not defer to how the contract is labeled.', es: 'Las sanciones por mala clasificación en Nueva York pueden incluir contribuciones atrasadas de seguro de desempleo más multas — los tribunales no se rigen por cómo está etiquetado el contrato.' },
  ],
  illinois: [
    { en: 'The Illinois Employee Classification Act (820 ILCS 185) applies an ABC-style test specifically to construction industry contractors, with steep per-violation penalties.', es: 'La Ley de Clasificación de Empleados de Illinois (820 ILCS 185) aplica una prueba estilo ABC específicamente a contratistas de la industria de la construcción, con fuertes multas por cada infracción.' },
    { en: 'Outside construction, Illinois generally applies a common-law right-to-control test for classification disputes.', es: 'Fuera de la construcción, Illinois generalmente aplica una prueba de derecho a controlar del derecho común para disputas de clasificación.' },
    { en: 'Chicago-based engagements should also check the Chicago Minimum Wage Ordinance, which can apply depending on how the relationship is actually structured.', es: 'Los acuerdos con sede en Chicago también deben revisar la Ordenanza de Salario Mínimo de Chicago, que puede aplicar según cómo esté estructurada realmente la relación.' },
  ],
  pennsylvania: [
    { en: 'The Pennsylvania Construction Workplace Misclassification Act (43 P.S. §933.1) applies an ABC-style test to construction contractors specifically, with criminal penalties possible for willful violations.', es: 'La Ley de Mala Clasificación en el Lugar de Trabajo de Construcción de Pensilvania (43 P.S. §933.1) aplica una prueba estilo ABC específicamente a contratistas de construcción, con posibles sanciones penales por infracciones intencionales.' },
    { en: 'Outside construction, Pennsylvania uses a common-law multi-factor test focused on the degree of control over how the work is performed.', es: 'Fuera de la construcción, Pensilvania usa una prueba de múltiples factores de derecho común enfocada en el grado de control sobre cómo se realiza el trabajo.' },
    { en: 'Electronic signatures are valid under Pennsylvania\'s Electronic Transactions Act (73 P.S. §2260.101).', es: 'Las firmas electrónicas son válidas bajo la Ley de Transacciones Electrónicas de Pensilvania (73 P.S. §2260.101).' },
  ],
};

// Statute of limitations for a written contract varies meaningfully by
// state — directly relevant to how long a service agreement's protections
// actually matter in practice.
const SERVICE_FACTS: Record<string, Array<{ en: string; es: string }>> = {
  california: [
    { en: 'Written contracts have a 4-year statute of limitations for breach claims (Cal. Civ. Proc. Code §337).', es: 'Los contratos escritos tienen un plazo de prescripción de 4 años para reclamos por incumplimiento (Código de Procedimiento Civil §337).' },
    { en: 'California has adopted the Uniform Commercial Code for contracts involving the sale of goods, alongside common-law rules for pure service contracts.', es: 'California ha adoptado el Código Comercial Uniforme para contratos que involucran venta de bienes, junto con reglas de derecho común para contratos puramente de servicios.' },
    { en: 'Non-compete restrictions bundled into service agreements are void under Bus. & Prof. Code §16600 — keep restrictive terms focused on confidentiality instead.', es: 'Las restricciones de no competencia incluidas en acuerdos de servicio son nulas bajo el Código de Negocios y Profesiones §16600 — mantén los términos restrictivos enfocados en confidencialidad.' },
  ],
  texas: [
    { en: 'Written contracts generally have a 4-year statute of limitations for breach claims (Tex. Civ. Prac. & Rem. Code §16.004 / §16.051).', es: 'Los contratos escritos generalmente tienen un plazo de prescripción de 4 años para reclamos por incumplimiento (Código de Práctica Civil y Recursos §16.004 / §16.051).' },
    { en: 'Reasonable non-compete and non-solicit clauses are enforceable in Texas service agreements if limited in time, geography and scope (Tex. Bus. & Com. Code §15.50).', es: 'Las cláusulas razonables de no competencia y no solicitud son exigibles en acuerdos de servicio de Texas si están limitadas en tiempo, geografía y alcance (Código de Negocios y Comercio §15.50).' },
    { en: 'Texas courts generally respect a chosen governing-law and venue clause between sophisticated business parties.', es: 'Los tribunales de Texas generalmente respetan una cláusula elegida de ley aplicable y jurisdicción entre partes comerciales sofisticadas.' },
  ],
  florida: [
    { en: 'Written contracts have a 5-year statute of limitations for breach claims (Fla. Stat. §95.11(2)(b)) — longer than many neighboring states.', es: 'Los contratos escritos tienen un plazo de prescripción de 5 años para reclamos por incumplimiento (Estatuto §95.11(2)(b)) — más largo que en muchos estados vecinos.' },
    { en: 'Non-compete terms up to 2 years are presumed reasonable for former employees/contractors under Fla. Stat. §542.335.', es: 'Los términos de no competencia de hasta 2 años se presumen razonables para exempleados/contratistas bajo el Estatuto §542.335.' },
    { en: 'Electronic records and signatures are explicitly valid under Fla. Stat. §668.001 for most commercial agreements.', es: 'Los registros y firmas electrónicas son explícitamente válidos bajo el Estatuto §668.001 para la mayoría de los acuerdos comerciales.' },
  ],
  'new-york': [
    { en: 'Written contracts have a 6-year statute of limitations for breach claims (N.Y. C.P.L.R. §213) — among the longest windows in the country.', es: 'Los contratos escritos tienen un plazo de prescripción de 6 años para reclamos por incumplimiento (C.P.L.R. §213) — uno de los plazos más largos del país.' },
    { en: 'New York courts closely scrutinize non-compete clauses in service agreements, requiring they protect a legitimate business interest and be reasonable in scope.', es: 'Los tribunales de Nueva York examinan de cerca las cláusulas de no competencia en acuerdos de servicio, exigiendo que protejan un interés comercial legítimo y sean razonables en alcance.' },
    { en: 'New York is a common choice for the governing-law clause in national service agreements due to its well-developed commercial case law.', es: 'Nueva York es una elección común para la cláusula de ley aplicable en acuerdos de servicio nacionales debido a su jurisprudencia comercial bien desarrollada.' },
  ],
  illinois: [
    { en: 'Written contracts have an unusually long 10-year statute of limitations for breach claims (735 ILCS 5/13-206).', es: 'Los contratos escritos tienen un plazo de prescripción inusualmente largo de 10 años para reclamos por incumplimiento (735 ILCS 5/13-206).' },
    { en: 'The Illinois Freedom to Work Act restricts non-compete clauses for lower-wage workers — confirm compensation thresholds before adding restrictive covenants.', es: 'La Ley de Libertad para Trabajar de Illinois restringe las cláusulas de no competencia para trabajadores de menores ingresos — confirma los umbrales de compensación antes de agregar pactos restrictivos.' },
    { en: 'Illinois has adopted the Uniform Commercial Code for goods-related service agreements, alongside common-law rules for pure services.', es: 'Illinois ha adoptado el Código Comercial Uniforme para acuerdos de servicio relacionados con bienes, junto con reglas de derecho común para servicios puros.' },
  ],
  pennsylvania: [
    { en: 'Written contracts have a 4-year statute of limitations for breach claims (42 Pa. C.S. §5525).', es: 'Los contratos escritos tienen un plazo de prescripción de 4 años para reclamos por incumplimiento (42 Pa. C.S. §5525).' },
    { en: 'Pennsylvania courts require "new consideration" for a non-compete clause added to a service relationship after it has already started.', es: 'Los tribunales de Pensilvania exigen una "nueva contraprestación" para una cláusula de no competencia agregada a una relación de servicio después de que ya inició.' },
    { en: 'Electronic signatures are valid for service agreements under Pennsylvania\'s Electronic Transactions Act (73 P.S. §2260.101).', es: 'Las firmas electrónicas son válidas para acuerdos de servicio bajo la Ley de Transacciones Electrónicas de Pensilvania (73 P.S. §2260.101).' },
  ],
};

// Usury law (the maximum legal interest rate) is the single most
// consequential state variable for a promissory note — and it's full of
// exemptions, so facts are phrased as general caps, not absolute limits.
const NOTE_FACTS: Record<string, Array<{ en: string; es: string }>> = {
  california: [
    { en: 'California\'s constitutional usury cap is generally 10% per year for non-exempt personal loans (Cal. Const. Art. XV §1) — many licensed lenders and business loans are exempt.', es: 'El límite de usura constitucional de California es generalmente 10% anual para préstamos personales no exentos (Constitución, Art. XV §1) — muchos prestamistas licenciados y préstamos comerciales están exentos.' },
    { en: 'A promissory note should always state a clear principal, interest rate, payment schedule, and default/late-fee terms to be enforceable.', es: 'Un pagaré siempre debe indicar claramente el principal, la tasa de interés, el calendario de pagos y los términos de incumplimiento/mora para ser exigible.' },
    { en: 'Electronic signatures are valid for promissory notes under Cal. Civil Code §1633.7, alongside the Federal ESIGN Act.', es: 'Las firmas electrónicas son válidas para pagarés bajo el Código Civil §1633.7, junto con la Ley Federal ESIGN.' },
  ],
  texas: [
    { en: 'Texas uses a tiered usury system under the Finance Code — without a signed rate agreement the default cap is low (around 6%), while a written agreement allows substantially higher rates depending on loan type.', es: 'Texas usa un sistema de usura escalonado bajo el Código de Finanzas — sin un acuerdo de tasa firmado el límite predeterminado es bajo (alrededor de 6%), mientras que un acuerdo escrito permite tasas sustancialmente más altas según el tipo de préstamo.' },
    { en: 'Always specify the interest rate explicitly in writing — Texas courts will not assume a market rate if the note is silent.', es: 'Siempre especifica la tasa de interés explícitamente por escrito — los tribunales de Texas no asumirán una tasa de mercado si el pagaré no la menciona.' },
    { en: 'No state income tax simplifies interest income reporting for the lender compared to states with state-level tax withholding.', es: 'La ausencia de impuesto estatal sobre la renta simplifica el reporte de ingresos por intereses para el prestamista en comparación con estados que requieren retención estatal.' },
  ],
  florida: [
    { en: 'Florida caps interest at 18% for loans under $500,000; rates above 25% can trigger criminal usury penalties (Fla. Stat. §687.03).', es: 'Florida limita el interés a 18% para préstamos menores a $500,000; tasas superiores a 25% pueden activar sanciones penales por usura (Estatuto §687.03).' },
    { en: 'A written, signed promissory note is strong evidence of the loan terms if repayment is ever disputed in court.', es: 'Un pagaré escrito y firmado es evidencia sólida de los términos del préstamo si el pago se disputa alguna vez en un tribunal.' },
    { en: 'Electronic signatures on promissory notes are valid under Fla. Stat. §668.001.', es: 'Las firmas electrónicas en pagarés son válidas bajo el Estatuto de Florida §668.001.' },
  ],
  'new-york': [
    { en: 'New York\'s civil usury cap is 16% per year (Gen. Oblig. Law §5-501); rates at or above 25% can trigger criminal usury charges (Penal Law §190.40).', es: 'El límite de usura civil de Nueva York es 16% anual (Ley General de Obligaciones §5-501); tasas iguales o superiores a 25% pueden generar cargos penales por usura (Ley Penal §190.40).' },
    { en: 'Corporate borrowers are generally exempt from New York\'s usury caps — the exemptions matter as much as the cap itself.', es: 'Los prestatarios corporativos generalmente están exentos de los límites de usura de Nueva York — las exenciones importan tanto como el límite en sí.' },
    { en: 'Electronic signatures are valid for promissory notes under New York\'s Electronic Signatures and Records Act (ESRA).', es: 'Las firmas electrónicas son válidas para pagarés bajo la Ley de Firmas y Registros Electrónicos de Nueva York (ESRA).' },
  ],
  illinois: [
    { en: 'Illinois\' general usury cap is 9% absent a written rate agreement; a properly documented written agreement removes the cap for many loan types under the Illinois Interest Act (815 ILCS 205).', es: 'El límite de usura general de Illinois es 9% sin un acuerdo de tasa escrito; un acuerdo escrito debidamente documentado elimina el límite para muchos tipos de préstamo bajo la Ley de Interés de Illinois (815 ILCS 205).' },
    { en: 'Because the written agreement is what unlocks higher rates, a clear, signed promissory note matters more in Illinois than in states with a flat cap.', es: 'Como el acuerdo escrito es lo que habilita tasas más altas, un pagaré claro y firmado importa más en Illinois que en estados con un límite fijo.' },
    { en: 'The Illinois Electronic Commerce Security Act makes electronic signatures on promissory notes enforceable.', es: 'La Ley de Seguridad del Comercio Electrónico de Illinois hace exigibles las firmas electrónicas en pagarés.' },
  ],
  pennsylvania: [
    { en: 'Pennsylvania\'s default usury cap is 6% without a specific written rate agreement; the Loan Interest and Protection Law (41 P.S. §201) allows higher rates when properly documented.', es: 'El límite de usura predeterminado de Pensilvania es 6% sin un acuerdo de tasa escrito específico; la Ley de Interés y Protección de Préstamos (41 P.S. §201) permite tasas más altas cuando están debidamente documentadas.' },
    { en: 'Business and certain licensed-lender loans are commonly exempt from the general usury cap — confirm which category a given loan falls into.', es: 'Los préstamos comerciales y de ciertos prestamistas licenciados suelen estar exentos del límite general de usura — confirma en qué categoría cae un préstamo específico.' },
    { en: 'Electronic signatures on promissory notes are valid under Pennsylvania\'s Electronic Transactions Act (73 P.S. §2260.101).', es: 'Las firmas electrónicas en pagarés son válidas bajo la Ley de Transacciones Electrónicas de Pensilvania (73 P.S. §2260.101).' },
  ],
};

// DMV / title-transfer practicalities vary by state — the facts most
// people actually search for when they type "[state] bill of sale".
const VEHICLE_FACTS: Record<string, Array<{ en: string; es: string }>> = {
  california: [
    { en: 'The California DMV does not require a bill of sale for most private-party sales, but form REG 135 is recommended as proof of the sale price and date.', es: 'El DMV de California no exige un contrato de compraventa para la mayoría de las ventas entre particulares, pero se recomienda el formulario REG 135 como prueba del precio y fecha de venta.' },
    { en: 'A smog certification is required for most vehicle transfers before registration can be completed (with some exemptions for newer vehicles).', es: 'Se requiere un certificado de emisiones (smog) para la mayoría de las transferencias de vehículos antes de completar el registro (con algunas exenciones para vehículos más nuevos).' },
    { en: 'Both buyer and seller should keep a signed copy — the bill of sale is the buyer\'s main proof of purchase price for tax purposes.', es: 'Tanto el comprador como el vendedor deben conservar una copia firmada — el contrato de compraventa es la principal prueba del comprador sobre el precio de compra para fines fiscales.' },
  ],
  texas: [
    { en: 'A bill of sale is not required by the Texas DMV, but buyers must still file Form 130-U (Application for Texas Title) at the county tax office within 30 days.', es: 'El DMV de Texas no exige un contrato de compraventa, pero los compradores deben presentar el Formulario 130-U (Solicitud de Título de Texas) en la oficina de impuestos del condado dentro de 30 días.' },
    { en: 'Sales tax (6.25% state rate, plus local rate) is calculated on the purchase price stated in the bill of sale, so an accurate figure matters.', es: 'El impuesto sobre ventas (tasa estatal de 6.25%, más tasa local) se calcula sobre el precio de compra indicado en el contrato de compraventa, por lo que una cifra precisa es importante.' },
    { en: 'No state income tax, but vehicle sales tax still applies at the county tax office when the new title is filed.', es: 'No hay impuesto estatal sobre la renta, pero el impuesto sobre ventas de vehículos aún aplica en la oficina de impuestos del condado al presentar el nuevo título.' },
  ],
  florida: [
    { en: 'Florida requires a bill of sale (HSMV form 82050) for most private vehicle sales, and notarization is recommended to prove the purchase price.', es: 'Florida requiere un contrato de compraventa (formulario HSMV 82050) para la mayoría de las ventas privadas de vehículos, y se recomienda notarización para probar el precio de compra.' },
    { en: 'An odometer disclosure statement is required by federal and Florida law for most vehicles under 20,000 lbs and less than 20 model years old.', es: 'Se requiere una declaración de lectura de odómetro por ley federal y de Florida para la mayoría de los vehículos de menos de 20,000 libras y menos de 20 años modelo.' },
    { en: 'Electronic signatures on a Florida bill of sale are valid under Fla. Stat. §668.001.', es: 'Las firmas electrónicas en un contrato de compraventa de Florida son válidas bajo el Estatuto §668.001.' },
  ],
  'new-york': [
    { en: 'New York requires a bill of sale (Form DTF-802) specifically when the sale price seems below market value or the vehicle is a gift, for sales tax verification.', es: 'Nueva York requiere un contrato de compraventa (Formulario DTF-802) específicamente cuando el precio de venta parece estar por debajo del valor de mercado o el vehículo es un regalo, para verificación del impuesto sobre ventas.' },
    { en: 'The DMV uses the bill of sale to confirm sales tax owed at registration — an inaccurate price can trigger an audit.', es: 'El DMV usa el contrato de compraventa para confirmar el impuesto sobre ventas adeudado al registrar el vehículo — un precio inexacto puede activar una auditoría.' },
    { en: 'Electronic signatures are valid under New York\'s Electronic Signatures and Records Act (ESRA).', es: 'Las firmas electrónicas son válidas bajo la Ley de Firmas y Registros Electrónicos de Nueva York (ESRA).' },
  ],
  illinois: [
    { en: 'The Illinois Secretary of State does not mandate a bill of sale for most transfers, but strongly recommends one as proof of the transaction.', es: 'El Secretario de Estado de Illinois no exige un contrato de compraventa para la mayoría de las transferencias, pero lo recomienda firmemente como prueba de la transacción.' },
    { en: 'Buyers must complete the title transfer within 20 days of purchase to avoid a delinquent transfer fee.', es: 'Los compradores deben completar la transferencia de título dentro de 20 días de la compra para evitar una tarifa por retraso.' },
    { en: 'The Illinois Electronic Commerce Security Act makes electronic signatures on a bill of sale enforceable.', es: 'La Ley de Seguridad del Comercio Electrónico de Illinois hace exigibles las firmas electrónicas en un contrato de compraventa.' },
  ],
  pennsylvania: [
    { en: 'PennDOT does not require a separate bill of sale if the title is properly assigned, but recommends one when the vehicle is a gift or sold below fair market value, for sales tax purposes.', es: 'PennDOT no exige un contrato de compraventa separado si el título está debidamente cedido, pero lo recomienda cuando el vehículo es un regalo o se vende por debajo del valor justo de mercado, para fines de impuesto sobre ventas.' },
    { en: 'An odometer disclosure statement is required by federal and Pennsylvania law for most vehicles under 20 model years old.', es: 'Se requiere una declaración de lectura de odómetro por ley federal y de Pensilvania para la mayoría de los vehículos de menos de 20 años modelo.' },
    { en: 'Electronic signatures on a Pennsylvania bill of sale are valid under the Electronic Transactions Act (73 P.S. §2260.101).', es: 'Las firmas electrónicas en un contrato de compraventa de Pensilvania son válidas bajo la Ley de Transacciones Electrónicas (73 P.S. §2260.101).' },
  ],
};

const CONTRACTOR_FAQ: Record<string, { qEn: string; qEs: string; aEn: string; aEs: string }> = {
  california: { qEn: 'Why is worker misclassification riskier in California than other states?', qEs: '¿Por qué es más riesgosa la mala clasificación de trabajadores en California que en otros estados?', aEn: 'California uses the strict "ABC test" under AB5 — a worker is presumed an employee unless the hiring business can prove all three prongs of the test. Most other states use a more flexible common-law control test, so a relationship that qualifies as contractor work elsewhere may not in California.', aEs: 'California usa la estricta "prueba ABC" bajo AB5 — se presume que un trabajador es empleado a menos que la empresa contratante pueda demostrar los tres criterios de la prueba. La mayoría de los otros estados usan una prueba de control de derecho común más flexible, así que una relación que califica como trabajo de contratista en otro lugar podría no calificar en California.' },
  texas: { qEn: 'Does Texas use the same "ABC test" as California for contractors?', qEs: '¿Usa Texas la misma "prueba ABC" que California para contratistas?', aEn: 'No. Texas uses the common-law "right to control" test, which generally makes it easier to establish independent contractor status than under California\'s strict ABC test.', aEs: 'No. Texas usa la prueba de derecho común de "derecho a controlar", lo que generalmente hace más fácil establecer el estatus de contratista independiente que bajo la estricta prueba ABC de California.' },
  florida: { qEn: 'Are Florida construction subcontractors treated differently?', qEs: '¿Se trata de forma diferente a los subcontratistas de construcción en Florida?', aEn: 'Yes. Florida requires most construction subcontractors to carry their own workers\' compensation coverage or risk being treated as employees for insurance purposes, on top of the general common-law classification test.', aEs: 'Sí. Florida exige que la mayoría de los subcontratistas de construcción tengan su propia cobertura de compensación laboral o corren el riesgo de ser tratados como empleados para fines de seguro, además de la prueba general de clasificación de derecho común.' },
  'new-york': { qEn: 'Which New York contractors face the strictest classification rules?', qEs: '¿Qué contratistas de Nueva York enfrentan las reglas de clasificación más estrictas?', aEn: 'Construction and commercial goods transportation contractors. The Construction Industry Fair Play Act and the Commercial Goods Transportation Industry Fair Play Act both presume workers are employees unless specific statutory criteria are met.', aEs: 'Los contratistas de construcción y de transporte de bienes comerciales. Tanto la Ley de Juego Limpio en la Industria de la Construcción como la Ley de Juego Limpio en la Industria de Transporte de Bienes Comerciales presumen que los trabajadores son empleados a menos que se cumplan criterios estatutarios específicos.' },
  illinois: { qEn: 'Does the Illinois Employee Classification Act apply to all contractors?', qEs: '¿Aplica la Ley de Clasificación de Empleados de Illinois a todos los contratistas?', aEn: 'No — it specifically targets the construction industry, applying an ABC-style test with steep per-violation penalties. Contractors outside construction are generally evaluated under the common-law right-to-control test.', aEs: 'No — se enfoca específicamente en la industria de la construcción, aplicando una prueba estilo ABC con fuertes multas por infracción. Los contratistas fuera de la construcción generalmente se evalúan bajo la prueba de derecho a controlar del derecho común.' },
  pennsylvania: { qEn: 'What makes Pennsylvania construction contracts different?', qEs: '¿Qué hace diferentes a los contratos de construcción de Pensilvania?', aEn: 'The Construction Workplace Misclassification Act applies an ABC-style test specifically to construction contractors, with potential criminal penalties for willful violations — a stricter standard than the common-law test used for other industries in the state.', aEs: 'La Ley de Mala Clasificación en el Lugar de Trabajo de Construcción aplica una prueba estilo ABC específicamente a contratistas de construcción, con posibles sanciones penales por infracciones intencionales — un estándar más estricto que la prueba de derecho común usada para otras industrias en el estado.' },
};

const SERVICE_FAQ: Record<string, { qEn: string; qEs: string; aEn: string; aEs: string }> = {
  california: { qEn: 'How long can someone sue over a breached service agreement in California?', qEs: '¿Cuánto tiempo puede alguien demandar por incumplimiento de un acuerdo de servicio en California?', aEn: 'Written contracts have a 4-year statute of limitations under Cal. Civ. Proc. Code §337, counted from the date of the breach.', aEs: 'Los contratos escritos tienen un plazo de prescripción de 4 años bajo el Código de Procedimiento Civil §337, contado desde la fecha del incumplimiento.' },
  texas: { qEn: 'What is the statute of limitations for a written contract in Texas?', qEs: '¿Cuál es el plazo de prescripción para un contrato escrito en Texas?', aEn: 'Generally 4 years from the date of breach under the Texas Civil Practice and Remedies Code.', aEs: 'Generalmente 4 años desde la fecha del incumplimiento bajo el Código de Práctica Civil y Recursos de Texas.' },
  florida: { qEn: 'How long is Florida\'s statute of limitations for written contracts?', qEs: '¿Cuánto dura el plazo de prescripción de Florida para contratos escritos?', aEn: '5 years under Fla. Stat. §95.11(2)(b) — longer than the 4-year window used in many other states.', aEs: '5 años bajo el Estatuto §95.11(2)(b) — más largo que el plazo de 4 años usado en muchos otros estados.' },
  'new-york': { qEn: 'What is New York\'s statute of limitations for a service agreement?', qEs: '¿Cuál es el plazo de prescripción de Nueva York para un acuerdo de servicio?', aEn: '6 years for a written contract under N.Y. C.P.L.R. §213 — one of the longer windows in the country.', aEs: '6 años para un contrato escrito bajo el C.P.L.R. §213 — uno de los plazos más largos del país.' },
  illinois: { qEn: 'Why does Illinois have such a long statute of limitations for contracts?', qEs: '¿Por qué tiene Illinois un plazo de prescripción tan largo para contratos?', aEn: 'Illinois sets a 10-year statute of limitations for written contracts (735 ILCS 5/13-206) — notably longer than most states, meaning a signed agreement stays enforceable for a long time.', aEs: 'Illinois establece un plazo de prescripción de 10 años para contratos escritos (735 ILCS 5/13-206) — notablemente más largo que la mayoría de los estados, lo que significa que un acuerdo firmado sigue siendo exigible por mucho tiempo.' },
  pennsylvania: { qEn: 'What is the statute of limitations for a Pennsylvania service agreement?', qEs: '¿Cuál es el plazo de prescripción para un acuerdo de servicio de Pensilvania?', aEn: '4 years under 42 Pa. C.S. §5525, counted from the date of the breach.', aEs: '4 años bajo 42 Pa. C.S. §5525, contado desde la fecha del incumplimiento.' },
};

const NOTE_FAQ: Record<string, { qEn: string; qEs: string; aEn: string; aEs: string }> = {
  california: { qEn: 'What is the maximum interest rate on a California promissory note?', qEs: '¿Cuál es la tasa de interés máxima en un pagaré de California?', aEn: 'Generally 10% per year for non-exempt personal loans under the state constitution\'s usury cap, though many licensed lenders and business loans are exempt — check which category your loan falls into.', aEs: 'Generalmente 10% anual para préstamos personales no exentos bajo el límite de usura de la constitución estatal, aunque muchos prestamistas licenciados y préstamos comerciales están exentos — verifica en qué categoría cae tu préstamo.' },
  texas: { qEn: 'What happens if a Texas promissory note doesn\'t state an interest rate?', qEs: '¿Qué pasa si un pagaré de Texas no indica una tasa de interés?', aEn: 'Without a signed rate agreement, Texas defaults to a low statutory rate (around 6%). A written agreement is required to charge the higher rates generally allowed for the loan type.', aEs: 'Sin un acuerdo de tasa firmado, Texas usa por defecto una tasa legal baja (alrededor de 6%). Se requiere un acuerdo escrito para cobrar las tasas más altas generalmente permitidas para el tipo de préstamo.' },
  florida: { qEn: 'What interest rate triggers criminal usury in Florida?', qEs: '¿Qué tasa de interés activa usura penal en Florida?', aEn: 'Rates of 25% or more can trigger criminal usury penalties under Fla. Stat. §687.03. The civil usury cap for loans under $500,000 is 18%.', aEs: 'Tasas de 25% o más pueden activar sanciones penales por usura bajo el Estatuto §687.03. El límite de usura civil para préstamos menores a $500,000 es 18%.' },
  'new-york': { qEn: 'What is New York\'s usury cap for a promissory note?', qEs: '¿Cuál es el límite de usura de Nueva York para un pagaré?', aEn: 'The civil usury cap is 16% per year; rates at or above 25% can trigger criminal usury charges. Corporate borrowers are generally exempt from these caps.', aEs: 'El límite de usura civil es 16% anual; tasas iguales o superiores a 25% pueden generar cargos penales por usura. Los prestatarios corporativos generalmente están exentos de estos límites.' },
  illinois: { qEn: 'Does a written agreement change the usury cap in Illinois?', qEs: '¿Cambia un acuerdo escrito el límite de usura en Illinois?', aEn: 'Yes. Without one, the cap is 9% per year. A properly documented written agreement removes the cap for many loan types under the Illinois Interest Act — which is why a clear, signed note matters so much here.', aEs: 'Sí. Sin uno, el límite es 9% anual. Un acuerdo escrito debidamente documentado elimina el límite para muchos tipos de préstamo bajo la Ley de Interés de Illinois — por eso un pagaré claro y firmado importa tanto aquí.' },
  pennsylvania: { qEn: 'What is Pennsylvania\'s default interest rate cap?', qEs: '¿Cuál es el límite de tasa de interés predeterminado de Pensilvania?', aEn: '6% without a specific written rate agreement. The Loan Interest and Protection Law allows higher rates when the terms are properly documented in writing.', aEs: '6% sin un acuerdo de tasa escrito específico. La Ley de Interés y Protección de Préstamos permite tasas más altas cuando los términos están debidamente documentados por escrito.' },
};

const VEHICLE_FAQ: Record<string, { qEn: string; qEs: string; aEn: string; aEs: string }> = {
  california: { qEn: 'Does California require a bill of sale to register a vehicle?', qEs: '¿California exige un contrato de compraventa para registrar un vehículo?', aEn: 'Not for most private-party sales, but the DMV recommends form REG 135 as proof of the sale price and date, and a smog certification is generally required before registration.', aEs: 'No para la mayoría de las ventas entre particulares, pero el DMV recomienda el formulario REG 135 como prueba del precio y fecha de venta, y generalmente se requiere un certificado de emisiones antes del registro.' },
  texas: { qEn: 'What do I need besides a bill of sale to transfer a vehicle title in Texas?', qEs: '¿Qué necesito además de un contrato de compraventa para transferir el título de un vehículo en Texas?', aEn: 'Form 130-U (Application for Texas Title), filed at the county tax office within 30 days of purchase. Sales tax is calculated on the price stated in the bill of sale.', aEs: 'El Formulario 130-U (Solicitud de Título de Texas), presentado en la oficina de impuestos del condado dentro de 30 días de la compra. El impuesto sobre ventas se calcula sobre el precio indicado en el contrato de compraventa.' },
  florida: { qEn: 'Is a bill of sale required to sell a car in Florida?', qEs: '¿Se requiere un contrato de compraventa para vender un auto en Florida?', aEn: 'Yes — Florida requires a bill of sale (HSMV form 82050) for most private vehicle sales, and notarization is recommended to prove the purchase price.', aEs: 'Sí — Florida requiere un contrato de compraventa (formulario HSMV 82050) para la mayoría de las ventas privadas de vehículos, y se recomienda notarización para probar el precio de compra.' },
  'new-york': { qEn: 'When does New York require a bill of sale for a vehicle sale?', qEs: '¿Cuándo exige Nueva York un contrato de compraventa para la venta de un vehículo?', aEn: 'Specifically when the sale price looks below market value or the vehicle is a gift — the DMV uses Form DTF-802 to verify sales tax owed at registration.', aEs: 'Específicamente cuando el precio de venta parece estar por debajo del valor de mercado o el vehículo es un regalo — el DMV usa el Formulario DTF-802 para verificar el impuesto sobre ventas adeudado al registrar el vehículo.' },
  illinois: { qEn: 'How long do I have to transfer a vehicle title after buying in Illinois?', qEs: '¿Cuánto tiempo tengo para transferir el título de un vehículo después de comprarlo en Illinois?', aEn: '20 days from the purchase date, or a delinquent transfer fee applies. A bill of sale isn\'t mandated by the Secretary of State but is strongly recommended as proof of the transaction.', aEs: '20 días desde la fecha de compra, o aplica una tarifa por retraso. El Secretario de Estado no exige un contrato de compraventa, pero se recomienda firmemente como prueba de la transacción.' },
  pennsylvania: { qEn: 'Does Pennsylvania require a separate bill of sale?', qEs: '¿Pensilvania exige un contrato de compraventa separado?', aEn: 'Not if the title is properly assigned at sale, but PennDOT recommends one when the vehicle is a gift or sold below fair market value, for sales tax verification purposes.', aEs: 'No si el título está debidamente cedido al momento de la venta, pero PennDOT recomienda uno cuando el vehículo es un regalo o se vende por debajo del valor justo de mercado, para fines de verificación del impuesto sobre ventas.' },
};

export const DOCTYPE_STATE_CONFIGS: DocTypeState[] = STATES.flatMap((s) => {
  const ndaFaq = NDA_FAQ[s.slug];
  const leaseFaq = LEASE_FAQ[s.slug];
  const contractorFaq = CONTRACTOR_FAQ[s.slug];
  const serviceFaq = SERVICE_FAQ[s.slug];
  const noteFaq = NOTE_FAQ[s.slug];
  const vehicleFaq = VEHICLE_FAQ[s.slug];
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
    {
      docType: 'independent-contractor' as const,
      docTypeLabelEn: 'Independent Contractor Agreement', docTypeLabelEs: 'Contrato de Contratista Independiente',
      generatorPath: '/generator/independent-contractor',
      stateSlug: s.slug, stateName: s.name, stateNameEs: s.nameEs, stateAbbr: s.abbr,
      facts: CONTRACTOR_FACTS[s.slug],
      faqEn: contractorFaq.qEn, faqEs: contractorFaq.qEs, faqAnswerEn: contractorFaq.aEn, faqAnswerEs: contractorFaq.aEs,
    },
    {
      docType: 'service-agreement' as const,
      docTypeLabelEn: 'Service Agreement', docTypeLabelEs: 'Acuerdo de Servicio',
      generatorPath: '/generator/service-agreement',
      stateSlug: s.slug, stateName: s.name, stateNameEs: s.nameEs, stateAbbr: s.abbr,
      facts: SERVICE_FACTS[s.slug],
      faqEn: serviceFaq.qEn, faqEs: serviceFaq.qEs, faqAnswerEn: serviceFaq.aEn, faqAnswerEs: serviceFaq.aEs,
    },
    {
      docType: 'promissory-note' as const,
      docTypeLabelEn: 'Promissory Note', docTypeLabelEs: 'Pagaré',
      generatorPath: '/generator/promissory-note',
      stateSlug: s.slug, stateName: s.name, stateNameEs: s.nameEs, stateAbbr: s.abbr,
      facts: NOTE_FACTS[s.slug],
      faqEn: noteFaq.qEn, faqEs: noteFaq.qEs, faqAnswerEn: noteFaq.aEn, faqAnswerEs: noteFaq.aEs,
    },
    {
      docType: 'vehicle-bill-of-sale' as const,
      docTypeLabelEn: 'Vehicle Bill of Sale', docTypeLabelEs: 'Contrato de Compraventa de Vehículo',
      generatorPath: '/generator/bill-of-sale-vehicle',
      stateSlug: s.slug, stateName: s.name, stateNameEs: s.nameEs, stateAbbr: s.abbr,
      facts: VEHICLE_FACTS[s.slug],
      faqEn: vehicleFaq.qEn, faqEs: vehicleFaq.qEs, faqAnswerEn: vehicleFaq.aEn, faqAnswerEs: vehicleFaq.aEs,
    },
  ];
});
