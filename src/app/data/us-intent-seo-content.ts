/**
 * Veinte páginas en inglés para el mercado de Estados Unidos.
 *
 * ── De dónde salen estos veinte temas ────────────────────────────────────
 *
 * No de una lluvia de ideas: de Search Console, 12 meses. Estados Unidos
 * generaba 205 impresiones y CERO clics en posición media 40 — es decir, la
 * gente ya nos ve, pero en la cuarta página y para consultas que no teníamos
 * cubiertas con una página propia. Los grupos, por volumen real medido:
 *
 *   · Letter of Intent — 53 impresiones repartidas en siete consultas
 *     («loi letter of intent», «carta de intenciones», «letter of intent
 *     compraventa»…). Es el grupo más grande del sitio y no existía ni una
 *     página dedicada: sólo un artículo de blog en posición 52.
 *   · ESIGN Act / UETA — 16 impresiones en consultas legales, más 78
 *     impresiones del artículo de blog en posición 52 sin un solo clic.
 *   · Bancos y servicios financieros — 14 impresiones.
 *   · Agentes inmobiliarios — 7 impresiones, más las consultas de «docusign
 *     lease agreement» y «docusign rental agreement template».
 *   · Alternativa a DocuSign — consultas de marca de la competencia, que son
 *     las de mayor intención de compra que existen.
 *
 * ── Por qué el texto es largo y concreto ─────────────────────────────────
 *
 * Ver el estándar de CLAUDE.md: una página de aterrizaje que sólo cambia un
 * nombre dentro de una plantilla se lee como lo que es. Cada una lleva su
 * dolor concreto, una cita legal real y verificable, un caso reconocible y
 * sus propias preguntas frecuentes. Es lo que separa un grupo de páginas
 * deliberado de un montón de páginas hiladas.
 */

export interface PaginaUS {
  slug: string;
  /** ≤ 60 caracteres: Google corta ahí. */
  titleTag: string;
  /** ≤ 155 caracteres. */
  metaDescription: string;
  h1: string;
  /** El grupo temático, para enlazar entre hermanas. */
  grupo: 'loi' | 'legal' | 'finance' | 'realestate' | 'compare' | 'family' | 'money' | 'lease';
  intro: string;
  problema: { titulo: string; texto: string };
  puntos: Array<{ titulo: string; texto: string }>;
  ley: { titulo: string; texto: string };
  caso: { titulo: string; texto: string };
  faq: Array<{ q: string; a: string }>;
  fotos: [string, string, string];
  cta: string;
}

const F = {
  firma: '/images/seo/tablet-sign-business.jpg',
  revisar: '/images/seo/tablet-review-woman.jpg',
  escritorio: '/images/seo/dashboard-desk.jpg',
  oficina: '/images/seo/office-tablet-woman.jpg',
  hombre: '/images/seo/app-man-blue.jpg',
  mujer: '/images/seo/app-woman-blue.jpg',
  tech: '/images/seo/app-woman-tech-blue.jpg',
  movil: '/images/contadores/profesional-movil.jpg',
} as const;

export const PAGINAS_US: PaginaUS[] = [
  // ═══════════════ LETTER OF INTENT — el grupo de más demanda ═══════════
  {
    slug: 'letter-of-intent',
    titleTag: 'Free Letter of Intent Template',
    metaDescription: 'Write a letter of intent that states what is binding and what is not. Free template, instant preview, signed online under the ESIGN Act.',
    h1: 'Letter of Intent',
    grupo: 'loi',
    intro: 'A letter of intent puts a handshake on paper before anyone spends money on lawyers. It says what the two sides have agreed in principle, what still has to be worked out, and how long the other party has to decide. Written well, it moves a deal forward. Written carelessly, it accidentally becomes the deal.',
    problema: {
      titulo: 'The clause that turns a maybe into a contract',
      texto: 'Most people write a letter of intent believing it commits them to nothing. That belief is wrong often enough to matter. Courts across the United States have repeatedly enforced letters of intent that read like final agreements — because the document named a price, named a closing date, described exactly what was being sold, and never once said it was non-binding. Intent is judged by what the paper says, not by what the writer assumed. The fix is one paragraph, and it is the paragraph most templates leave out.',
    },
    puntos: [
      { titulo: 'It separates what binds from what does not', texto: 'Almost every letter of intent is a hybrid. The commercial terms — price, structure, timeline — are meant as a starting point. But confidentiality, exclusivity, who pays their own costs, and which state law governs are usually meant to bind from the day it is signed. Our template keeps those two groups visibly apart, so nobody has to argue later about which was which.' },
      { titulo: 'It sets a deadline that actually expires', texto: 'A letter of intent with no expiry is an option the other side holds for free. Ours carries an expiry date and states plainly what happens when it passes: the terms lapse and neither side owes the other anything. That single line is what stops a buyer from sitting on your business for four months while they shop around.' },
      { titulo: 'It records exclusivity in writing', texto: 'If you have agreed to stop talking to other buyers, that promise is worth writing down with its own end date. If you have not agreed to that, the document should say so — otherwise the other side may believe you did, and behave accordingly.' },
      { titulo: 'It survives the deal falling apart', texto: 'Roughly half of all letters of intent never become contracts. What matters then is that the confidentiality clause outlives the negotiation, so the numbers you disclosed do not travel to a competitor. Ours states its own survival period rather than going quiet on the point.' },
    ],
    ley: {
      titulo: 'What makes it enforceable',
      texto: 'There is no federal statute governing letters of intent; enforceability is decided under the contract law of the state you name. What is settled is the signature: the Electronic Signatures in Global and National Commerce Act, 15 U.S.C. § 7001, provides that a signature, contract or record may not be denied legal effect solely because it is in electronic form. Every state except New York has also adopted the Uniform Electronic Transactions Act; New York reaches the same result through its Electronic Signatures and Records Act, State Technology Law § 304. So the question is never whether your electronic signature counts — it is whether the words above it say what you meant.',
    },
    caso: {
      titulo: 'A seller who nearly gave away four months',
      texto: 'A founder agreed to sell a small logistics company and signed a two-page letter of intent the buyer sent over. It named a price, a structure, and a diligence period — and said nothing about exclusivity or expiry. The buyer took eleven weeks, renegotiated down twice, and walked. The founder had turned away two other approaches during that period because she believed the letter obliged her to. It did not. It also did not oblige the buyer to anything. The document she should have signed was the same length, with two more paragraphs.',
    },
    faq: [
      { q: 'Is a letter of intent legally binding?', a: 'Usually only in part. The commercial terms are normally non-binding until a definitive agreement is signed, while confidentiality, exclusivity, cost allocation and governing law are normally intended to bind immediately. What decides it is the wording, not the label — a document titled "non-binding" that reads like a contract has been enforced as one.' },
      { q: 'What is the difference between an LOI and a term sheet?', a: 'In practice, very little. A term sheet is usually a bulleted list of commercial terms, common in investment deals; a letter of intent is written as a letter and is more common in acquisitions and real estate. Both carry the same legal risk if they omit the binding/non-binding split.' },
      { q: 'Do both parties have to sign it?', a: 'A letter of intent signed by only one side is an offer, not an understanding. Countersignature is what turns it into a shared record — and is what makes the confidentiality and exclusivity clauses enforceable against the other party.' },
      { q: 'How long should a letter of intent stay open?', a: 'Long enough for real diligence, short enough that it costs the other side something to stall. Thirty to sixty days is common for a small business sale; two weeks is common in residential real estate. The number matters less than having one.' },
    ],
    fotos: [F.firma, F.revisar, F.oficina],
    cta: 'Write your letter of intent free',
  },
  {
    slug: 'letter-of-intent-real-estate',
    titleTag: 'Real Estate Letter of Intent Template',
    metaDescription: 'Free real estate letter of intent for a purchase or lease. Sets price, term and diligence, and says clearly what binds. Sign it online.',
    h1: 'Real Estate Letter of Intent',
    grupo: 'loi',
    intro: 'Before a purchase and sale agreement exists, a real estate deal lives in a letter of intent. It fixes the price, the deposit, how long the buyer has to inspect, and who pays for what at closing — with enough precision that the lawyers can draft from it, and enough restraint that nobody is locked in yet.',
    problema: {
      titulo: 'Where property deals fall apart',
      texto: 'Almost never over price. They fall apart over what "as is" was supposed to mean, who was paying for the survey, whether the tenant estoppels were the seller\'s job, and how many days the buyer really had. Those items are cheap to settle in a letter of intent and expensive to argue about once earnest money is at stake and a closing date is on a calendar.',
    },
    puntos: [
      { titulo: 'Price, deposit and how the deposit behaves', texto: 'The number matters less than the conditions around it. Our template records the purchase price, the earnest money amount, when it goes hard, and what happens to it if the buyer walks during diligence. Deals sour when a deposit turns non-refundable on a date nobody wrote down.' },
      { titulo: 'A diligence window with a stated start', texto: 'Thirty days from when? Signature, or delivery of the seller\'s documents? That ambiguity has cost buyers entire inspection periods. The template makes the trigger explicit.' },
      { titulo: 'What conveys and what does not', texto: 'Appliances, fixtures, equipment, existing leases, service contracts. Listing them in the letter of intent is ten minutes of work that removes the most common closing-table argument in commercial property.' },
      { titulo: 'Exclusivity with an end date', texto: 'A seller who takes the property off the market is giving up real optionality. That is worth granting in exchange for a deposit or a shorter diligence window — and worth writing with an expiry so it does not run indefinitely.' },
    ],
    ley: {
      titulo: 'Why the writing requirement matters here',
      texto: 'Every U.S. state enforces some version of the Statute of Frauds, which requires contracts for the sale of an interest in land to be in writing and signed by the party to be charged. That is precisely why a real estate letter of intent needs its non-binding language stated rather than assumed: a signed writing that identifies the parties, the property and the price is exactly the shape a court looks for. The signature itself is settled — the ESIGN Act, 15 U.S.C. § 7001, gives electronic signatures the same effect as ink, and UETA does the same at state level in 49 states.',
    },
    caso: {
      titulo: 'A retail building and a survey nobody ordered',
      texto: 'A buyer and seller agreed on a strip retail property in about a week. The letter of intent covered price and closing date and stopped there. Six weeks in, the lender required an ALTA survey. Neither party had agreed to pay for it, both assumed it was the other, and the argument cost eleven days — which mattered, because the buyer\'s rate lock expired on day fourteen. The survey cost less than the rate change did.',
    },
    faq: [
      { q: 'Does a real estate LOI have to be notarized?', a: 'No. Notarization is generally required for recording a deed, not for a letter of intent or a purchase agreement. What the Statute of Frauds requires is a signed writing, and an electronic signature satisfies that under the ESIGN Act.' },
      { q: 'Can I use a letter of intent for a commercial lease?', a: 'Yes, and it is standard practice. A lease LOI typically fixes rent, term, renewal options, tenant improvement allowance and who pays operating expenses — the items that take longest to draft — before the lawyers begin.' },
      { q: 'Should the LOI include the closing date?', a: 'Include a target, not a promise. Naming a target date sets pace without creating an obligation the buyer cannot yet meet, since financing and title are still unknown.' },
      { q: 'What if the seller receives a better offer after signing?', a: 'That depends entirely on whether the letter grants exclusivity. Without an exclusivity clause the seller is generally free to keep marketing the property, which is why buyers who care about certainty should ask for one and expect to pay for it.' },
    ],
    fotos: [F.oficina, F.escritorio, F.mujer],
    cta: 'Create your real estate LOI free',
  },
  {
    slug: 'letter-of-intent-business-purchase',
    titleTag: 'Letter of Intent to Buy a Business',
    metaDescription: 'Free letter of intent for buying or selling a business. Covers price, structure, diligence, exclusivity and confidentiality. Sign online.',
    h1: 'Letter of Intent to Purchase a Business',
    grupo: 'loi',
    intro: 'Buying a business starts long before the purchase agreement. The letter of intent is where the price gets anchored, the structure gets chosen, and the seller decides how much of the company to open up. Get it right and diligence runs on rails. Get it wrong and you renegotiate the same points three times.',
    problema: {
      titulo: 'Asset sale or stock sale is not a detail',
      texto: 'It is the single most consequential line in the document, and most letters of intent skip it. An asset purchase lets the buyer choose what liabilities to take and usually gives them a stepped-up basis; a stock purchase transfers the company whole, including the litigation nobody has mentioned yet. The tax outcome for the seller can differ by a large margin between the two. Agreeing on price without agreeing on structure means you have not agreed on price.',
    },
    puntos: [
      { titulo: 'Purchase price and how it is actually paid', texto: 'Cash at closing, seller note, earnout, escrow holdback. A headline number with no payment structure behind it is the most common cause of a deal repricing at week six.' },
      { titulo: 'What the seller must hand over during diligence', texto: 'Financial statements and for how many years, tax returns, customer contracts, employee list, outstanding litigation. Naming these upfront turns diligence from a negotiation into a checklist.' },
      { titulo: 'Confidentiality that outlives the deal', texto: 'The seller is about to show a stranger their margins, their customer concentration and their payroll. If the deal dies, that information must not. The clause needs its own survival period, stated in years.' },
      { titulo: 'What happens to the owner after closing', texto: 'Whether the seller stays for a transition, for how long, paid how, and whether they are restricted from competing. Leaving this to the definitive agreement means discovering at week eight that the buyer assumed a two-year employment commitment the seller never intended.' },
    ],
    ley: {
      titulo: 'Binding, non-binding, and who decides',
      texto: 'No federal statute governs the enforceability of a letter of intent; that is a matter of state contract law, and the analysis turns on the parties\' objective intent as shown by the document. This is why the express non-binding clause matters more here than anywhere else: business-sale letters of intent are detailed by nature, and detail is what courts read as intent to be bound. The electronic signature itself is not in doubt — 15 U.S.C. § 7001 under the ESIGN Act, and UETA in 49 states, put an electronic signature on the same footing as ink.',
    },
    caso: {
      titulo: 'An earnout that meant two different things',
      texto: 'A buyer offered a base price plus an earnout tied to "revenue" over two years. Neither the letter of intent nor, later, the purchase agreement defined whether that meant gross revenue or revenue net of returns and discounts. The business ran about eleven percent of gross in returns. The gap between the two readings was most of the earnout. It was settled eventually, but at a cost neither side had budgeted, over a word that could have been defined in the letter of intent in one clause.',
    },
    faq: [
      { q: 'Should the LOI name a specific purchase price?', a: 'A range is common early; a specific number is common once the seller has shared financials. Either works, provided the document says the price is subject to diligence and to a definitive agreement — otherwise you have written an offer, not an intent.' },
      { q: 'How long should exclusivity last in a business sale?', a: 'Long enough to complete diligence, typically thirty to ninety days. Sellers should resist open-ended exclusivity; buyers should expect to justify the length by what diligence actually requires.' },
      { q: 'Do I still need an NDA if the LOI has a confidentiality clause?', a: 'Often the NDA comes first, before the LOI exists, because the seller must disclose something just to get to a price. If a robust NDA is already signed, the LOI can reference it instead of repeating it.' },
      { q: 'Can a letter of intent be withdrawn?', a: 'The non-binding commercial terms generally can be, subject to any good-faith negotiation obligation the document creates. The binding clauses — confidentiality, exclusivity, expenses — remain in force according to their own terms.' },
    ],
    fotos: [F.escritorio, F.hombre, F.firma],
    cta: 'Draft your business purchase LOI',
  },

  // ═══════════════ VALIDEZ LEGAL — 78 impresiones sin un clic ═══════════
  {
    slug: 'is-an-electronic-signature-legally-binding',
    titleTag: 'Are Electronic Signatures Legally Binding?',
    metaDescription: 'Yes — under the ESIGN Act and UETA, in all 50 states. What the law actually requires, what it excludes, and how to prove a signature later.',
    h1: 'Are Electronic Signatures Legally Binding in the United States?',
    grupo: 'legal',
    intro: 'The short answer is yes, and it has been settled since 2000. The longer answer is the useful one: the law does not make every electronic signature valid. It makes them impossible to reject *solely because they are electronic*. That distinction is where disputes are actually won and lost.',
    problema: {
      titulo: 'The signature is rarely the weak point',
      texto: 'When an agreement is challenged, the argument is almost never "electronic signatures are not legal." It is that the person who signed was not who they claimed, or never saw the document they supposedly agreed to, or that the file was altered afterwards. A signature image pasted into a PDF answers none of those. What answers them is a record: who opened the document, from what address, when, what exactly they saw, and cryptographic proof the file has not changed since.',
    },
    puntos: [
      { titulo: 'Intent to sign, captured', texto: 'The law requires that the signature be executed with intent to sign. A record showing the signer opened the document, reviewed it and then acted deliberately is what demonstrates that intent when someone later says they never agreed.' },
      { titulo: 'Association with the record', texto: 'The signature must be logically associated with the document it signs. A hash of the exact file, recorded at signing, is how that association is proved: change one character afterwards and the hash no longer matches.' },
      { titulo: 'Attribution to a person', texto: 'Email verification, IP address, device fingerprint, and where the risk warrants it, identity document capture or biometric confirmation. Each layer narrows the space for a plausible denial.' },
      { titulo: 'A record both parties can keep', texto: 'The statute requires that electronic records be capable of retention and accurate reproduction by the parties entitled to them. A signed PDF plus its audit trail, downloadable by everyone involved, satisfies that.' },
    ],
    ley: {
      titulo: 'ESIGN, UETA, and the exclusions people forget',
      texto: 'The federal Electronic Signatures in Global and National Commerce Act, 15 U.S.C. § 7001(a), provides that a signature, contract, or other record relating to a transaction may not be denied legal effect, validity, or enforceability solely because it is in electronic form. The Uniform Electronic Transactions Act reaches the same result at state level and has been adopted in 49 states; New York uses its own Electronic Signatures and Records Act, State Technology Law § 304. The exclusions matter: 15 U.S.C. § 7003 carves out wills, codicils and testamentary trusts, adoption and divorce and other family law matters, most of the Uniform Commercial Code, court orders and notices, and certain utility, insurance and foreclosure notices. For those, check state law before relying on an electronic signature.',
    },
    caso: {
      titulo: 'The dispute that turned on a timestamp',
      texto: 'A contractor claimed he had never approved a change order that added scope without adding money. The signature on it was his name in a script font — the kind any word processor produces. There was no record of when it was signed, from where, or of what the document contained at that moment. The change order was worth about nine thousand dollars and the argument cost more than that. A signature with an audit trail would have ended it in one email, in either direction.',
    },
    faq: [
      { q: 'Do I need a special certificate for an electronic signature to be valid?', a: 'Not in the United States. ESIGN and UETA are technology-neutral: they do not require certificates, hardware tokens or a specific standard. Certificate-based digital signatures are common in the EU and in some regulated U.S. contexts, but they are not a condition of validity here.' },
      { q: 'Which documents cannot be signed electronically?', a: '15 U.S.C. § 7003 excludes wills and testamentary trusts, most family law matters including adoption and divorce, most of the UCC, court documents, and certain notices such as utility cancellation, health insurance termination and foreclosure. Several states have since permitted electronic wills by statute, so check the specific state.' },
      { q: 'Is a typed name a valid signature?', a: 'It can be, if it was executed with intent to sign and is logically associated with the record. Whether it survives a challenge is a different question, and depends on what evidence exists around it.' },
      { q: 'How long should I keep the audit trail?', a: 'At least as long as the statute of limitations for a claim under that contract, which in most states runs four to six years for written contracts. Keeping the signed file and its trail together is what makes the record usable later.' },
    ],
    fotos: [F.firma, F.tech, F.revisar],
    cta: 'Sign a document with a full audit trail',
  },
  {
    slug: 'esign-act-compliance',
    titleTag: 'ESIGN Act Compliance Explained',
    metaDescription: 'What the ESIGN Act requires: consent, intent, association and retention. The four conditions, the exclusions, and how to meet them.',
    h1: 'ESIGN Act Compliance',
    grupo: 'legal',
    intro: 'The ESIGN Act is short and often misread. It does not certify vendors or bless particular technology. It sets conditions, and a signature that meets them is as good as ink. Most compliance failures are not technical — they are a missing consent step or a record nobody can retrieve two years later.',
    problema: {
      titulo: 'Consumer consent is the clause most often skipped',
      texto: 'When a business provides a consumer with information that some other law requires to be in writing, the ESIGN Act does not simply allow an electronic version. It requires the consumer to affirmatively consent, and requires that consent to be given in a way that reasonably demonstrates the consumer can actually access the format. The business must also disclose the right to withdraw consent, the scope, how to get a paper copy and what it costs, and the hardware and software needed. Skipping this does not usually surface at signing. It surfaces in a regulatory examination.',
    },
    puntos: [
      { titulo: 'Intent to sign', texto: 'The signer must act deliberately. A record of the signing session — what was shown, when it was opened, what was clicked — is what evidences intent if it is questioned.' },
      { titulo: 'Consent to do business electronically', texto: 'Both parties must agree to transact electronically. For consumer transactions covered by a writing requirement, that consent has the specific form described above.' },
      { titulo: 'Association with the record', texto: 'The signature must be tied to the document signed. A cryptographic hash captured at signature time proves the file has not been altered since.' },
      { titulo: 'Retention and accurate reproduction', texto: 'The record must remain accessible to everyone entitled to it and reproducible accurately. A PDF that only the sender can retrieve does not satisfy this.' },
    ],
    ley: {
      titulo: 'Where each requirement lives in the statute',
      texto: 'The general rule is at 15 U.S.C. § 7001(a): no denial of legal effect solely because the record or signature is electronic. Consumer consent and its disclosures are at § 7001(c). Record retention is at § 7001(d), which requires that the record accurately reflect the information and remain accessible to those entitled to it in a form capable of accurate reproduction. Exclusions are at § 7003. Section 7002 governs how state law interacts with the federal act — which is why a state that has adopted UETA can supersede the federal rules, and why New York, which has not, relies on State Technology Law § 304.',
    },
    caso: {
      titulo: 'A lender who had signatures but no consent record',
      texto: 'A small consumer lender moved its disclosures online and collected signatures cleanly. Two years later an examination asked for the consent records showing borrowers had agreed to receive the required disclosures electronically. The platform had captured the signature but had never presented or stored the § 7001(c) consent. The signatures themselves were sound. The disclosures made through them were the problem, and the remediation reached every file from the switchover onward.',
    },
    faq: [
      { q: 'Does ESIGN apply to business-to-business contracts?', a: 'Yes, the general rule at § 7001(a) applies to any transaction in or affecting interstate commerce. The consumer consent requirements at § 7001(c) apply only where another law requires that information be provided to a consumer in writing.' },
      { q: 'Does ESIGN or my state UETA control?', a: 'Section 7002 allows a state that has adopted UETA in its official form to modify or supersede the federal provisions. In practice the two are consistent for most transactions. Where they differ, the specific state statute is the one to read.' },
      { q: 'Is ESIGN compliance something a vendor can certify?', a: 'No. There is no certifying authority under the act. A platform can make compliance easier by capturing consent, intent, association and a retrievable record — but compliance belongs to the business using it.' },
      { q: 'What if a consumer withdraws consent?', a: 'The withdrawal is prospective: it does not affect the legal validity of records already provided and signed electronically. Going forward, that consumer must receive the affected information in the form the underlying law requires.' },
    ],
    fotos: [F.revisar, F.escritorio, F.oficina],
    cta: 'Start signing with compliant records',
  },
  {
    slug: 'ueta-vs-esign-act',
    titleTag: 'UETA vs ESIGN Act: The Difference',
    metaDescription: 'One is federal, one is state. Where they overlap, where a state can override the federal rule, and why New York is the exception.',
    h1: 'UETA vs the ESIGN Act',
    grupo: 'legal',
    intro: 'Two laws, the same destination. The ESIGN Act is federal and applies to transactions in or affecting interstate commerce. UETA is a model act adopted state by state. Most of the time they agree, which is why the difference rarely matters — until it does.',
    problema: {
      titulo: 'The question people are really asking',
      texto: 'Nobody wants a comparative law lecture. They want to know which rules apply to the contract in front of them, whether a signature will hold, and whether the state they operate in changes anything. The answer is usually: apply UETA as adopted in your state, and treat the ESIGN Act as the floor beneath it. Two situations break that rule, and both are worth knowing.',
    },
    puntos: [
      { titulo: 'ESIGN is the federal floor', texto: 'It guarantees that an electronic signature cannot be rejected solely for being electronic, across every state, for transactions affecting interstate commerce. Nothing a state does can remove that floor for those transactions.' },
      { titulo: 'UETA is how 49 states say the same thing', texto: 'Adopted in every state except New York, UETA gives electronic records and signatures the same effect as paper within that state\'s law, and adds detail ESIGN leaves out — attribution, errors in transmission, and the effect of an automated agent.' },
      { titulo: 'A state can supersede parts of ESIGN', texto: 'Section 7002 permits a state that has enacted UETA in its official form to modify or supersede the federal provisions. This is why the operative text for most domestic transactions is the state statute, not the federal one.' },
      { titulo: 'New York took its own route', texto: 'New York never adopted UETA. It reaches an equivalent result through the Electronic Signatures and Records Act, codified at State Technology Law § 304, which gives electronic signatures the same validity and effect as handwritten ones.' },
    ],
    ley: {
      titulo: 'The provisions that matter',
      texto: 'ESIGN: 15 U.S.C. § 7001(a) for the general rule, § 7001(c) for consumer consent, § 7002 for the interaction with state law, § 7003 for exclusions. UETA: section 7 gives records and signatures legal effect, section 9 covers attribution, section 10 covers changes and errors, and section 12 covers retention. New York: State Technology Law § 304. UETA\'s exclusions are narrower than ESIGN\'s in some states and identical in others, which is one more reason to read the version your state enacted rather than the model text.',
    },
    caso: {
      titulo: 'A multi-state lease portfolio and one outlier',
      texto: 'A property manager standardised electronic signing across leases in eight states and assumed one process would serve all of them. Seven were straightforward. The New York properties raised a question from counsel that took two weeks to close out — not because electronic signatures are invalid there, but because the authority is a different statute and nobody on the team could point to it. The process did not change. The documentation of why it was sound did.',
    },
    faq: [
      { q: 'If my state has UETA, does ESIGN still apply?', a: 'Yes, as a floor for transactions in or affecting interstate commerce. Where the state has adopted UETA in its official form, § 7002 lets the state provisions govern. In practice the outcome is the same for the overwhelming majority of contracts.' },
      { q: 'Are UETA exclusions the same as ESIGN exclusions?', a: 'Not always. UETA excludes wills, codicils and testamentary trusts and most of the UCC, and some states added their own carve-outs when they enacted it. Always check the enacted state version rather than the model act.' },
      { q: 'Does Illinois or Washington differ?', a: 'Both have adopted UETA, Illinois replacing an earlier electronic commerce statute. Where a state modernised an older act, transitional provisions occasionally matter for older records — rarely for new ones.' },
      { q: 'Which should a contract name as governing?', a: 'Contracts generally name a governing state law rather than a signature statute. Naming the state is what determines which version of UETA, or which alternative, applies to the signature question.' },
    ],
    fotos: [F.tech, F.mujer, F.escritorio],
    cta: 'Sign under ESIGN and UETA',
  },

  // ═══════════════ SERVICIOS FINANCIEROS — 14 impresiones ═══════════════
  {
    slug: 'electronic-signature-for-banks',
    titleTag: 'Electronic Signatures for Banks',
    metaDescription: 'E-signature built for lending and account opening: identity verification, tamper-evident records and audit trails an examiner can follow.',
    h1: 'Electronic Signatures for Banks and Credit Unions',
    grupo: 'finance',
    intro: 'A bank does not need a signature tool. It needs an evidence trail that survives an examination, a dispute and a discovery request — three audiences with very different questions and one shared demand: show me exactly what happened, and prove it has not changed.',
    problema: {
      titulo: 'The examiner asks a different question than the customer',
      texto: 'The customer asks whether the loan is signed. The examiner asks whether the borrower consented to receive the disclosures electronically, whether the disclosures were the ones in effect that day, whether the record can be reproduced accurately, and how you know the person who signed was the borrower. Most institutions can answer the first question instantly and the rest slowly, by assembling evidence from four systems. That assembly is where remediation cost lives.',
    },
    puntos: [
      { titulo: 'Identity verification proportionate to risk', texto: 'Email confirmation for a routine form, government ID capture and biometric confirmation for a loan agreement. The record shows which was used, so the file itself explains why that level was appropriate.' },
      { titulo: 'Tamper-evident records', texto: 'A SHA-256 hash of the executed document, captured at signature. If the file is altered by a single character afterwards, the hash no longer matches — which is what turns "we believe this is the signed version" into a demonstrable fact.' },
      { titulo: 'Consent captured, not assumed', texto: 'The § 7001(c) consumer consent to electronic disclosures is presented, recorded and stored with the file, rather than living in a separate onboarding system nobody thinks to pull.' },
      { titulo: 'A complete chronological trail', texto: 'Sent, opened, viewed, signed, with timestamps, IP addresses and device information. Reconstructing that from logs after the fact is possible; having it attached to the document is what makes it usable.' },
    ],
    ley: {
      titulo: 'The rules that apply to a lender',
      texto: 'The ESIGN Act, 15 U.S.C. § 7001, governs the electronic signature and, at § 7001(c), the consumer consent required before delivering electronically any disclosure that another law requires in writing — which in lending means Truth in Lending, Regulation Z and Regulation E disclosures, among others. Section 7001(d) requires the record to remain accessible and accurately reproducible by those entitled to it. Section 7003 excludes certain notices, including some default, foreclosure and insurance cancellation notices, so those still require the form the underlying law prescribes.',
    },
    caso: {
      titulo: 'Ninety days of file reconstruction',
      texto: 'A community lender used one system for identity, another for disclosures, a third for signatures and a fourth for storage. Every individual record was defensible. Assembling them into a coherent story, file by file, for an examination sample, took a two-person team most of a quarter. Nothing was wrong with the loans. The cost was entirely in proving that.',
    },
    faq: [
      { q: 'Is an electronic signature enough for a loan agreement?', a: 'Yes, for the signature itself, under ESIGN and state UETA. What varies is the disclosure regime around the loan — consumer credit disclosures carry their own timing and consent requirements that the signature does not satisfy on its own.' },
      { q: 'How do we verify the signer is really the borrower?', a: 'Layered: email confirmation, then government ID capture with a selfie match, and where supported, device biometrics such as Touch ID or Windows Hello. The record states which layers were used for that signature.' },
      { q: 'Can we require paper for some products?', a: 'Yes. ESIGN permits but does not compel electronic records, and a consumer may decline or withdraw consent. Many institutions keep paper available for products where the disclosure regime is unsettled.' },
      { q: 'What should we retain, and for how long?', a: 'The executed document, the audit trail and the consent record, together, for at least the applicable record retention period and the statute of limitations — whichever is longer. Keeping them in one place is what makes retrieval survivable.' },
    ],
    fotos: [F.escritorio, F.firma, F.hombre],
    cta: 'See how the audit trail works',
  },
  {
    slug: 'e-signature-for-financial-services',
    titleTag: 'E-Signature for Financial Services',
    metaDescription: 'Advisory agreements, account forms and disclosures signed with verified identity and an audit trail built for compliance review.',
    h1: 'E-Signature for Financial Services Firms',
    grupo: 'finance',
    intro: 'Advisory agreements, account applications, suitability acknowledgements, fee schedules. The volume is not the problem — the problem is that each one has to be retrievable, unaltered, and attributable years after the person who handled it has left the firm.',
    problema: {
      titulo: 'Documents that outlive the relationship',
      texto: 'A client agreement signed today may be examined in six years, in the context of a complaint about advice given in year three. What matters then is not that the document exists, but that you can show which version the client saw, when they saw it, that they signed it themselves, and that nothing changed afterwards. Firms that store a flat PDF have the document. Firms that store the document with its trail have the answer.',
    },
    puntos: [
      { titulo: 'Version certainty', texto: 'The exact document presented at signature, hashed at that moment. When the fee schedule changes in year two, there is no ambiguity about which schedule the year-one client agreed to.' },
      { titulo: 'Attribution beyond a name', texto: 'Identity verification recorded alongside the signature, so attribution does not rest on the assumption that whoever had the email link was the client.' },
      { titulo: 'Delivery evidence', texto: 'Sent, delivered, opened, signed — with timestamps. For disclosures with a timing requirement, evidence of delivery matters as much as evidence of signature.' },
      { titulo: 'Retrieval that does not require the original sender', texto: 'Records accessible to the firm as a firm, not scattered across individual advisers\' accounts. Turnover is the most common reason a record becomes unreachable.' },
    ],
    ley: {
      titulo: 'What governs the record',
      texto: 'The signature is governed by the ESIGN Act, 15 U.S.C. § 7001, and by state UETA. Section 7001(d) is the provision that matters most in this sector: the record must accurately reflect the information and remain accessible to all persons entitled to it, in a form capable of accurate reproduction. Firms also operate under their own books-and-records obligations, which set retention periods and, in some cases, requirements about the format and accessibility of stored records. The electronic signature statutes set the floor; the sector rules set the retention period.',
    },
    caso: {
      titulo: 'The adviser who left, and the file that left with them',
      texto: 'A client questioned a fee arrangement from four years earlier. The signed agreement had been sent from the departing adviser\'s individual account on a consumer e-signature plan. The document existed somewhere; the audit trail was tied to a seat the firm no longer paid for. The firm reconstructed enough to resolve the matter, but the exercise took weeks and produced a policy change that should have been the policy from the start. The lesson was not about the departing adviser, who had done nothing improper. It was that records belonging to the firm had been created inside an account belonging to a person, and nobody noticed until the person was gone. Any firm where advisers send client documents from their own tools has the same exposure, and it stays invisible for exactly as long as everyone stays.',
    },
    faq: [
      { q: 'Can advisory agreements be signed electronically?', a: 'Yes. There is no general prohibition, and the ESIGN Act and state UETA give the signature the same effect as ink. Retention and delivery obligations come from the firm\'s own regulatory regime and are unaffected by how the signature was captured.' },
      { q: 'Do we need the client\'s consent to send documents electronically?', a: 'Where another rule requires information to be furnished to a client in writing, § 7001(c) requires affirmative consent with specific disclosures. Many firms obtain this once at onboarding and record it with the account file.' },
      { q: 'How do we handle joint accounts?', a: 'Each signer receives their own link and signs separately, producing an individual trail per person. That is materially stronger evidence than one document returned with two signatures on it.' },
      { q: 'Is the audit trail admissible?', a: 'It is evidence, and its weight depends on its completeness and integrity. A trail with timestamps, addresses, an identity check and a document hash is considerably harder to dispute than an unsupported signature image.' },
    ],
    fotos: [F.oficina, F.revisar, F.tech],
    cta: 'Try it with your next client agreement',
  },
  {
    slug: 'loan-agreement-electronic-signature',
    titleTag: 'Loan Agreement Template & E-Signature',
    metaDescription: 'Free loan agreement with interest, schedule and default terms. Signed electronically with identity verification and a full audit trail.',
    h1: 'Loan Agreement with Electronic Signature',
    grupo: 'finance',
    intro: 'Money lent without a written agreement is a gift with optimism attached. A loan agreement records the amount, the interest, the repayment schedule and what happens when a payment is missed — which is the part everyone skips and the only part that matters when it goes wrong.',
    problema: {
      titulo: 'Default is where informal loans collapse',
      texto: 'The amount is remembered. The date is remembered. What almost nobody agrees in advance is how late a payment has to be before it is late, whether interest accrues on the missed amount, whether the whole balance becomes due, and who pays the cost of collection. Without those terms the lender has a debt and no leverage, and every conversation restarts the negotiation.',
    },
    puntos: [
      { titulo: 'Principal, interest and how interest is computed', texto: 'A rate with no compounding basis is ambiguous. The template states the rate, whether it is simple or compounding, and on what period.' },
      { titulo: 'A repayment schedule with real dates', texto: 'Instalment amount, frequency, first payment date and final date. "Monthly" without a start date has produced more disputes than any other loan term.' },
      { titulo: 'Late payment and acceleration', texto: 'What counts as late, any grace period, the late charge, and whether the lender may declare the entire balance due. This is the clause that converts a promise into an enforceable obligation.' },
      { titulo: 'Prepayment and security', texto: 'Whether the borrower may repay early without penalty, and whether anything secures the loan. Both change the economics and both are cheap to state.' },
    ],
    ley: {
      titulo: 'Interest rates and the limits that apply',
      texto: 'Interest on private loans is governed by state usury law, and the ceiling varies substantially between states — some cap non-commercial loans in the single digits absent a written agreement, others permit far more when the rate is agreed in writing. Exceeding the applicable ceiling can void the interest and, in some states, expose the lender to penalties. The signature is settled: the ESIGN Act, 15 U.S.C. § 7001, and state UETA give an electronically signed loan agreement the same effect as ink. Note that Article 3 of the Uniform Commercial Code, covering negotiable instruments, is among the ESIGN exclusions at § 7003 — which is why a formal negotiable promissory note deserves separate consideration from a simple loan agreement.',
    },
    caso: {
      titulo: 'Eighteen thousand dollars and no due date',
      texto: 'Two former colleagues agreed a loan for a business launch over dinner and confirmed it by text: the amount, and "pay me back when it works." Three years later one considered the loan overdue and the other considered it not yet due, and both were reading the same message. There was no schedule to point to. The friendship did not survive the disagreement, and the money was repaid at a pace neither had intended.',
    },
    faq: [
      { q: 'Does a loan agreement need a witness or notary?', a: 'Generally no for enforceability between the parties. Notarization is sometimes used for evidentiary comfort or where a security interest in real property is involved, in which case the security document has its own formalities.' },
      { q: 'What interest rate can I charge?', a: 'That depends on your state\'s usury statute and on whether the loan is commercial. Rates above the applicable ceiling risk voiding the interest entirely, so check the state that governs the agreement before naming a number.' },
      { q: 'Is a loan agreement the same as a promissory note?', a: 'They overlap. A promissory note is a promise to pay and can be a negotiable instrument under UCC Article 3; a loan agreement is broader, covering conditions, covenants and remedies. Many private loans use both.' },
      { q: 'Can I lend to a family member with this?', a: 'Yes, and it is exactly the situation where written terms matter most — because the social cost of asking for clarity later is higher than the cost of stating it now.' },
    ],
    fotos: [F.firma, F.escritorio, F.mujer],
    cta: 'Create your loan agreement free',
  },

  // ═══════════════ INMOBILIARIO ═══════════════
  {
    slug: 'electronic-signature-for-realtors',
    titleTag: 'E-Signature for Realtors and Agents',
    metaDescription: 'Listing agreements, disclosures and offers signed from a phone in minutes. Free to start, with an audit trail for every document.',
    h1: 'Electronic Signatures for Real Estate Agents',
    grupo: 'realestate',
    intro: 'Real estate runs on deadlines that do not move. An offer expires at five, the inspection period ends Friday, the seller is three time zones away. The signature is never the hard part of the job — but waiting for it is where deals are lost to someone who was faster.',
    problema: {
      titulo: 'The cost of a signature that takes a day',
      texto: 'A competing offer does not need to be better to win. It needs to be complete first. Every hour between "they said yes" and "it is signed" is an hour in which something changes: a second offer arrives, a buyer reconsiders, a lender calls. Agents who close that gap are not working harder, they are removing a step that never had to exist — the step where someone finds a printer.',
    },
    puntos: [
      { titulo: 'Signing from a phone, without an account', texto: 'The client receives a link, opens it, signs. No download, no registration, no software. The single largest cause of delay is asking a client to create an account before they can help you.' },
      { titulo: 'Multiple signers in sequence or at once', texto: 'Two buyers, two sellers, an agent acknowledgement. Each gets their own link and their own trail, and the document completes when the last one signs.' },
      { titulo: 'The document, unchanged and provable', texto: 'A hash captured at signature. When a counter-offer is disputed weeks later, the file itself proves which version was signed.' },
      { titulo: 'Everything retrievable in one place', texto: 'Listing agreement, disclosures, offer, addenda — filed together rather than spread across an inbox, so the transaction file is complete when the broker asks for it.' },
    ],
    ley: {
      titulo: 'Signature validity in a property transaction',
      texto: 'Contracts for the sale of an interest in land fall under the Statute of Frauds in every state and must be in a signed writing. The ESIGN Act, 15 U.S.C. § 7001, and state UETA satisfy that requirement electronically: a signature may not be denied effect solely because it is electronic. Note the boundary — the purchase contract may be signed electronically, but the deed that transfers title is usually recorded and generally requires notarization under the recording statutes of the state, and remote online notarization is available only where the state has authorised it.',
    },
    caso: {
      titulo: 'Lost by four hours',
      texto: 'An agent had a verbal yes on a listing at eleven in the morning. The sellers were driving to a family event and would not be near a printer until evening. She sent the listing agreement as a PDF attachment and asked them to print, sign and scan it. A second agent reached them at three with a link they signed on a phone in the passenger seat. The first agent had the better commission structure and the better marketing plan. She lost on logistics.',
    },
    faq: [
      { q: 'Can a purchase agreement be signed electronically?', a: 'Yes. The Statute of Frauds requires a signed writing, and ESIGN and state UETA make an electronic signature satisfy that requirement. The deed itself is a separate document with its own recording and notarization rules.' },
      { q: 'Do my clients need to install anything?', a: 'No. They open a link and sign in the browser, on a phone or a computer. Requiring an app or an account is the most common reason a signature request goes cold.' },
      { q: 'Is this accepted by brokerages and title companies?', a: 'Electronically signed contracts are standard practice in U.S. real estate. Individual brokerages may have their own document retention policies, which is a matter of internal procedure rather than legal validity.' },
      { q: 'What about disclosures with specific delivery timing?', a: 'Delivery evidence matters as much as signature there. The audit trail records when the document was sent, delivered and opened, which is precisely what a timing requirement needs to be demonstrated.' },
    ],
    fotos: [F.movil, F.oficina, F.firma],
    cta: 'Send your next offer for signature',
  },
  {
    slug: 'real-estate-purchase-agreement',
    titleTag: 'Real Estate Purchase Agreement Template',
    metaDescription: 'Free purchase agreement covering price, deposit, contingencies and closing. Written to be filled in, previewed and signed online.',
    h1: 'Real Estate Purchase Agreement',
    grupo: 'realestate',
    intro: 'The purchase agreement is where a property deal becomes real. It names the price, the deposit and the closing date — and, more importantly, the conditions under which either side may walk away without losing money.',
    problema: {
      titulo: 'Contingencies are the whole document',
      texto: 'Buyers focus on price. Experienced buyers focus on contingencies, because a contingency is the only thing standing between a deposit and a loss. Financing, inspection, appraisal, title, sale of an existing home — each needs a deadline and a stated consequence. A contingency without a date is not protection; it is a conversation you will have under time pressure.',
    },
    puntos: [
      { titulo: 'Price, deposit, and when the deposit goes hard', texto: 'The date the earnest money stops being refundable is the single most important date in the contract, and the one most often left implicit.' },
      { titulo: 'Financing and appraisal contingencies', texto: 'Whether the buyer may terminate if the loan is denied or the appraisal comes in low, by what date, and what happens to the deposit in each case.' },
      { titulo: 'Inspection rights and remedies', texto: 'How long the buyer has, what access they get, and whether they may demand repairs, a credit, or simply terminate. Ambiguity here creates the most common mid-contract dispute.' },
      { titulo: 'What conveys with the property', texto: 'Appliances, fixtures, window treatments, mounted equipment. Cheap to list; expensive to argue about the day before closing.' },
    ],
    ley: {
      titulo: 'Writing requirement and signature',
      texto: 'The Statute of Frauds, in force in every U.S. state, requires that a contract for the sale of an interest in land be in writing and signed by the party against whom enforcement is sought. Electronic signature satisfies this: 15 U.S.C. § 7001 under the ESIGN Act provides that a contract may not be denied legal effect solely because an electronic signature was used, and UETA does the same at state level in 49 states, with New York relying on State Technology Law § 304. Disclosure obligations vary substantially by state — several require specific written disclosures about property condition, lead paint in older housing under federal law, or natural hazards — and those are separate from the contract itself.',
    },
    caso: {
      titulo: 'A financing contingency with no deadline',
      texto: 'A buyer wrote an offer contingent on obtaining financing, without a date by which the contingency had to be removed. The lender took nine weeks. The seller, who had a move scheduled, wanted to terminate and relist; the buyer maintained the contingency was still live. Both were arguably right, which is another way of saying the contract had not decided the question. They settled by extending, and the seller paid for a month of storage that a single date in the offer would have avoided.',
    },
    faq: [
      { q: 'Do I need a lawyer for a purchase agreement?', a: 'Several states require attorney involvement in residential closings, and in others it is customary. A template gets the terms organised and the deal moving; it does not replace advice on a specific property or an unusual structure.' },
      { q: 'How much earnest money is normal?', a: 'Commonly one to three percent of the purchase price in residential transactions, higher in competitive markets and in commercial deals. What matters more than the amount is when it becomes non-refundable.' },
      { q: 'Can the seller accept another offer after signing?', a: 'Not without breaching, once the contract is executed. Sellers sometimes accept back-up offers explicitly contingent on the first contract terminating, which is a different arrangement and should be documented as one.' },
      { q: 'Is a purchase agreement the same as a letter of intent?', a: 'No. A letter of intent records an understanding and is usually mostly non-binding; a purchase agreement is the binding contract. In commercial transactions the LOI typically comes first and the purchase agreement is drafted from it.' },
    ],
    fotos: [F.escritorio, F.mujer, F.revisar],
    cta: 'Build your purchase agreement free',
  },

  // ═══════════════ COMPARATIVA — intención de compra alta ═══════════════
  {
    slug: 'docusign-alternative',
    titleTag: 'A Free DocuSign Alternative',
    metaDescription: 'Same legal validity under the ESIGN Act, without a per-envelope plan. Identity verification and audit trail included, free to start.',
    h1: 'A Free Alternative to DocuSign',
    grupo: 'compare',
    intro: 'Most people looking for an alternative are not unhappy with the signing experience. They are unhappy with paying a monthly subscription to send four documents, or with hitting an envelope limit in the middle of a busy month.',
    problema: {
      titulo: 'Per-envelope pricing does not fit uneven work',
      texto: 'Freelancers, small agencies, independent agents and one-person firms do not send documents at a steady rate. They send eleven in March and none in April. A plan priced for steady volume charges for the quiet months and constrains the busy ones — and the moment a limit is hit, the workaround is emailing a PDF, which loses exactly the evidence the tool existed to create.',
    },
    puntos: [
      { titulo: 'The same legal footing', texto: 'Validity comes from the ESIGN Act and state UETA, not from a brand. A signature captured with intent, associated with the document and backed by a retrievable record is valid regardless of which platform produced it.' },
      { titulo: 'Identity verification included, not tiered', texto: 'Email verification, government ID capture, selfie matching and device biometrics such as Touch ID or Windows Hello — available on the free tier rather than reserved for an enterprise plan.' },
      { titulo: 'Documents included, not just signatures', texto: 'Most alternatives sign a file you already have. Here the templates — NDAs, leases, service agreements, letters of intent — are part of the product, so the document and its signature come from the same place.' },
      { titulo: 'No account required for the person signing', texto: 'The recipient opens a link and signs. Asking a client to register before they can help you is the most reliable way to slow down a signature.' },
    ],
    ley: {
      titulo: 'Validity does not depend on the vendor',
      texto: 'The ESIGN Act, 15 U.S.C. § 7001(a), provides that a signature or contract may not be denied legal effect solely because it is in electronic form, and § 7001(d) requires that the record remain accessible and accurately reproducible by those entitled to it. UETA does the same at state level in 49 states; New York applies State Technology Law § 304. None of these statutes certifies or prefers a provider — they set conditions. What distinguishes platforms in practice is the quality of the evidence they capture around the signature, not the legal status of the signature itself.',
    },
    caso: {
      titulo: 'The month the limit ran out',
      texto: 'A two-person design studio sent contracts steadily until a project brought four new clients in the same fortnight. They hit their plan limit on a Thursday and, rather than upgrade mid-month for a spike that would not repeat, emailed the last two agreements as PDFs to be printed and returned. One came back scanned and signed. The other came back with a changed payment schedule that nobody noticed until invoicing.',
    },
    faq: [
      { q: 'Is a free electronic signature as valid as a paid one?', a: 'Legally, yes — ESIGN and UETA do not distinguish by price or provider. What varies is the evidence captured: identity verification, timestamps, addresses and a document hash are what make a signature defensible if challenged.' },
      { q: 'Can I import a PDF I already have?', a: 'Yes. You can upload an existing document to be signed, or start from a template and generate the document here, in which case the wording and the signature come from the same source.' },
      { q: 'Does the other person need to pay or register?', a: 'No. They open the link, review the document and sign. Nothing to install, no account to create.' },
      { q: 'What happens when I need more than the free tier?', a: 'There are paid plans for higher volume, but the free tier is a working product rather than a trial — including identity verification and the audit trail, which are the parts that matter in a dispute.' },
    ],
    fotos: [F.tech, F.firma, F.hombre],
    cta: 'Send a document free right now',
  },
  {
    slug: 'free-lease-agreement-template',
    titleTag: 'Free Lease Agreement Template',
    metaDescription: 'Residential lease covering rent, deposit, term and entry rules, written to your state. Fill it in, preview it and sign online free.',
    h1: 'Free Lease Agreement Template',
    grupo: 'lease',
    intro: 'A lease is the most commonly signed contract in the country and the one most often downloaded from wherever came up first. The risk is not that a generic lease looks wrong — it is that it quietly contains terms your state does not allow, which are unenforceable exactly when you need them.',
    problema: {
      titulo: 'A generic lease is a state-law problem',
      texto: 'Security deposit limits, the deadline to return the deposit and itemise deductions, how much notice is required before entering, whether late fees are capped, whether a landlord may recover attorney fees — all of these are set by state law and differ substantially. A lease that names a deposit above the state maximum does not simply fail on that clause; it can expose the landlord to statutory penalties in several states. Tenants signing such a lease often do not discover this until move-out.',
    },
    puntos: [
      { titulo: 'Rent, due date and late terms that hold up', texto: 'Amount, when it is due, any grace period and a late fee within what the state permits. A late fee a court will not enforce is worse than none, because it invites a dispute you lose.' },
      { titulo: 'Security deposit within state limits', texto: 'The amount, where it is held, what may be deducted and the deadline to return it with an itemised statement. This clause causes more landlord-tenant litigation than any other.' },
      { titulo: 'Entry notice', texto: 'How much warning a landlord must give before entering, and the exceptions for genuine emergencies. Stating it prevents the most common source of friction in an otherwise good tenancy.' },
      { titulo: 'Maintenance, utilities and the end of the term', texto: 'Who fixes what, who pays which utility, what condition the property must be returned in, and what happens if neither party gives notice at the end of the term.' },
    ],
    ley: {
      titulo: 'Where the rules come from',
      texto: 'Residential tenancies are governed almost entirely by state statute, and roughly half the states have adopted some version of the Uniform Residential Landlord and Tenant Act, with local modifications. Deposit caps, return deadlines, notice periods and permissible fees are set there, and a lease clause conflicting with the statute is generally unenforceable to that extent. Federal law adds a narrow but strict overlay: the Residential Lead-Based Paint Hazard Reduction Act requires specific disclosure and an EPA-approved pamphlet for most housing built before 1978. The signature itself is covered by the ESIGN Act, 15 U.S.C. § 7001, and state UETA.',
    },
    caso: {
      titulo: 'A deposit clause copied from another state',
      texto: 'A first-time landlord used a lease template found online, which set the security deposit at two months\' rent. The state where the property sat capped residential deposits below that figure and provided a statutory penalty for exceeding it. The tenancy went well for fourteen months. It ended with a deposit dispute in which the landlord\'s own lease was the strongest evidence against him.',
    },
    faq: [
      { q: 'Is an electronically signed lease valid?', a: 'Yes, in every state, under the ESIGN Act and state UETA. Some jurisdictions have specific rules about delivering certain notices or disclosures, which is a separate question from whether the lease signature is valid.' },
      { q: 'How much can I charge as a security deposit?', a: 'It depends on the state — some cap it at one month, others at two, and some set no statutory limit. Exceeding the cap can trigger penalties, so the state rule should decide the number.' },
      { q: 'Do I need the lead paint disclosure?', a: 'For most residential housing built before 1978, yes. Federal law requires the disclosure and an EPA-approved pamphlet, and the obligation falls on the landlord regardless of the lease wording.' },
      { q: 'Can I change the lease after it is signed?', a: 'Only by written agreement of both parties, normally as an addendum signed by everyone. A unilateral change to a signed lease is not effective.' },
    ],
    fotos: [F.mujer, F.escritorio, F.oficina],
    cta: 'Create your lease free',
  },
  {
    slug: 'nda-template',
    titleTag: 'Free NDA Template (Mutual or One-Way)',
    metaDescription: 'Non-disclosure agreement that defines what is confidential, for how long, and what happens if it leaks. Free, and signed online.',
    h1: 'Free NDA Template',
    grupo: 'legal',
    intro: 'An NDA is short, which makes people careless with it. Three clauses do the real work: what counts as confidential, how long the obligation lasts, and what the disclosing party can actually do if it is breached. Most templates handle the first badly and the third not at all.',
    problema: {
      titulo: 'An NDA that protects everything protects nothing',
      texto: 'The instinct is to define confidential information as broadly as possible. Courts read broad definitions narrowly, because an obligation covering "all information disclosed" is unreasonable to comply with — the recipient cannot tell what they are restricted from using. A definition that names categories, and carves out what is genuinely public or independently developed, is both fairer and considerably more likely to be enforced.',
    },
    puntos: [
      { titulo: 'What is confidential, stated in categories', texto: 'Financials, customer lists, source code, pricing, product plans. Naming categories is what makes the obligation usable — and enforceable — rather than aspirational.' },
      { titulo: 'What is excluded', texto: 'Information already public, already known to the recipient, independently developed, or received lawfully from a third party. Without these carve-outs the agreement asks for something the recipient cannot deliver.' },
      { titulo: 'A term with an end', texto: 'Two years, five years, indefinitely for trade secrets. A perpetual obligation over ordinary business information is one of the most common reasons an NDA is narrowed by a court.' },
      { titulo: 'Remedies', texto: 'Whether the disclosing party may seek injunctive relief, and who bears legal costs. Damages for a leak are notoriously difficult to quantify, which is why the right to stop the disclosure matters more than the right to be paid for it.' },
    ],
    ley: {
      titulo: 'Trade secrets and the notice most NDAs omit',
      texto: 'Confidentiality obligations are creatures of contract, interpreted under state law, and most states have adopted a version of the Uniform Trade Secrets Act. Federally, the Defend Trade Secrets Act of 2016 created a civil cause of action for trade secret misappropriation, codified at 18 U.S.C. § 1836. It also added a requirement that is widely overlooked: 18 U.S.C. § 1833(b) provides immunity for disclosing a trade secret in confidence to a government official or attorney solely to report a suspected legal violation, and an employer who fails to include notice of that immunity in an agreement governing trade secrets may not recover exemplary damages or attorney fees under the act against that employee. The signature is covered by the ESIGN Act, 15 U.S.C. § 7001, and state UETA.',
    },
    caso: {
      titulo: 'Everything was confidential, so nothing was',
      texto: 'A startup used an NDA defining confidential information as "any and all information disclosed, in any form, whether or not marked confidential." A former contractor later used a general technique he had known before the engagement. The startup argued breach. The definition was broad enough to cover the contractor\'s own prior knowledge, which is precisely why it did not hold up as written. A definition naming categories, with a prior-knowledge carve-out, would have been narrower on paper and stronger in practice.',
    },
    faq: [
      { q: 'Should the NDA be mutual or one-way?', a: 'Mutual when both sides will disclose something, which is most commercial conversations. One-way when only one side is opening up, such as a company sharing financials with a prospective buyer who is disclosing nothing.' },
      { q: 'How long should an NDA last?', a: 'Two to five years is common for ordinary business information. Trade secrets are often carved out to be protected for as long as they remain secret, which is a different and legitimate treatment.' },
      { q: 'Is an NDA enforceable against an employee?', a: 'Generally yes as to genuine confidential information, though it is distinct from a non-compete, which many states restrict heavily or prohibit. Employers should also include the § 1833(b) immunity notice.' },
      { q: 'What if the other side refuses to sign one?', a: 'That is information. A refusal is sometimes reasonable — investors and some acquirers decline as a matter of policy — and sometimes a signal about how your information will be treated.' },
    ],
    fotos: [F.revisar, F.firma, F.tech],
    cta: 'Create your NDA free',
  },

  // ═══════════════ FAMILIA — la de matrimonio, mejorada ═══════════════
  {
    slug: 'prenuptial-agreement',
    titleTag: 'Prenuptial Agreement Template',
    metaDescription: 'Free prenup covering property, debt and support. Written to be reviewed, disclosed and signed well before the wedding date.',
    h1: 'Prenuptial Agreement',
    grupo: 'family',
    intro: 'A prenuptial agreement decides in advance what happens to property, debt and income if a marriage ends. It is uncomfortable to raise and considerably less uncomfortable than deciding the same questions during a divorce, when neither side is inclined to be generous.',
    problema: {
      titulo: 'Prenups fail on process, not on content',
      texto: 'When a prenuptial agreement is set aside, the reason is rarely that its terms were unfair on their face. It is that one party did not disclose what they owned, or the agreement was signed days before the wedding under evident pressure, or one side had counsel and the other did not. The terms may be perfectly reasonable and still unenforceable because of how they came to be signed. Which means the timeline and the disclosure matter as much as the drafting.',
    },
    puntos: [
      { titulo: 'Full financial disclosure, attached', texto: 'Assets, debts, income and business interests, listed by both parties and attached as schedules. Incomplete disclosure is the most common ground for setting a prenup aside.' },
      { titulo: 'Separate versus marital property', texto: 'What each person brings in, what stays separate, and how property acquired during the marriage is treated — including the appreciation of a business one spouse owned before.' },
      { titulo: 'Debt', texto: 'Student loans, business obligations, credit cards. Deciding who carries pre-marital debt, and whether marital income services it, prevents the most common surprise.' },
      { titulo: 'Spousal support', texto: 'Whether it is waived, limited or calculated. Many states permit agreement on support, but some will not enforce a waiver that would leave a spouse dependent on public assistance.' },
    ],
    ley: {
      titulo: 'The framework and its limits',
      texto: 'Most states have adopted the Uniform Premarital Agreement Act, which sets out when a premarital agreement is enforceable and when it may be set aside — generally where it was not executed voluntarily, or was unconscionable when signed and the challenging party lacked adequate disclosure and did not waive it. California codifies related rules at Family Code § 1600 and following, including a seven-day period between when a party is first presented with the agreement and when it is signed. One boundary is firm across states: child support and child custody cannot be bindingly determined in advance, because those are decided on the child\'s best interests at the time. Note also that the ESIGN Act excludes family law matters at 15 U.S.C. § 7003, so an electronic signature on a prenuptial agreement should be confirmed against state requirements — several states require a signed writing and some require acknowledgment.',
    },
    caso: {
      titulo: 'Signed the night before',
      texto: 'A couple agreed in principle months ahead but the document was produced by one side\'s attorney and presented the evening before the ceremony, with guests already arrived. The terms were not extreme. The circumstances were, and the timing alone gave the other spouse a credible argument that it was not signed voluntarily. The agreement was contested years later and much of what it decided was reopened. The same document signed two months earlier would very likely have held.',
    },
    faq: [
      { q: 'When should a prenup be signed?', a: 'Weeks or months before the wedding, never in the final days. California requires at least seven days between presentation and signing, and courts elsewhere treat last-minute execution as evidence of pressure regardless of any statutory period.' },
      { q: 'Do both parties need their own lawyer?', a: 'It is not universally required, but independent counsel for each party is the single strongest protection against a later claim of unfairness or duress — and some states scrutinise waivers of counsel closely.' },
      { q: 'Can a prenup decide child custody or support?', a: 'No. Those are determined by the court in the child\'s best interests at the relevant time, and a prenuptial provision purporting to fix them is not binding.' },
      { q: 'Is a prenup only for wealthy couples?', a: 'No. It is at least as useful for allocating debt, protecting a small business or a family property, and clarifying what happens to income earned during the marriage.' },
    ],
    fotos: [F.oficina, F.revisar, F.mujer],
    cta: 'Start your prenuptial agreement',
  },
  {
    slug: 'postnuptial-agreement',
    titleTag: 'Postnuptial Agreement Template',
    metaDescription: 'A postnup settles property, debt and support after the wedding. Free template, full disclosure schedules, reviewed and signed properly.',
    h1: 'Postnuptial Agreement',
    grupo: 'family',
    intro: 'A postnuptial agreement does what a prenup does, signed after the marriage has begun. Couples reach for one when circumstances change — a business is started, an inheritance arrives, one spouse leaves work to raise children, or the marriage is being repaired and both want clarity.',
    problema: {
      titulo: 'Signed between spouses, and scrutinised more closely',
      texto: 'A prenuptial agreement is negotiated between two people who are not yet legally bound to each other. A postnuptial agreement is negotiated between spouses, who in most states owe each other a fiduciary duty. That changes the standard: courts examine postnups more carefully, and disclosure that would have been adequate before the wedding may not be adequate after it. The care that goes into the process matters even more here.',
    },
    puntos: [
      { titulo: 'Why the agreement is being made', texto: 'Stating the circumstances — a new business, an inheritance, a career change — helps establish that both parties acted deliberately rather than under pressure.' },
      { titulo: 'Complete and current disclosure', texto: 'Not the position at the wedding, but the position now, including anything acquired since. Both sets of schedules attached to the agreement itself.' },
      { titulo: 'Property acquired during the marriage', texto: 'The central question of most postnups: how what has already been built together, and what will be built from here, is treated.' },
      { titulo: 'Independent legal advice for each spouse', texto: 'More important here than in a prenup, precisely because of the fiduciary relationship between the parties.' },
    ],
    ley: {
      titulo: 'Recognition varies by state',
      texto: 'The Uniform Premarital Agreement Act addresses agreements made before marriage; postnuptial agreements are largely governed by state case law and, in some states, by specific statute. Most states enforce them, applying heightened scrutiny because of the fiduciary duty spouses owe one another — a duty that in community property states such as California is expressly codified. A minority of states are markedly more restrictive, particularly where the agreement was negotiated while a separation was already contemplated. As with prenuptial agreements, child support and custody cannot be bindingly fixed in advance, and the ESIGN Act excludes family law matters at 15 U.S.C. § 7003, so state execution requirements govern the signature.',
    },
    caso: {
      titulo: 'A business that grew after the wedding',
      texto: 'One spouse launched a company three years into the marriage, funded partly from savings that predated it. By year seven it was the family\'s main asset and the couple had no agreement about how it would be treated. Neither wanted to litigate the question later, and neither could answer it confidently. A postnuptial agreement with proper disclosure settled it in a few weeks, at a cost that was a rounding error against what a contested valuation would have run. What made it work was that the marriage was not in trouble. Both had counsel, both disclosed fully, and neither was deciding under pressure — which is precisely the combination that makes an agreement hold. Couples who wait until the relationship is strained find that the same document is harder to negotiate and easier to challenge later, for reasons that have nothing to do with its terms.',
    },
    faq: [
      { q: 'Are postnuptial agreements enforceable?', a: 'In most states, yes, subject to closer scrutiny than a prenup because of the fiduciary duty between spouses. A minority of states are considerably more restrictive, so the governing state matters.' },
      { q: 'How is a postnup different from a separation agreement?', a: 'A postnuptial agreement is made by spouses who intend to stay married. A separation agreement is made when they are separating and typically resolves immediate matters such as living arrangements and interim support.' },
      { q: 'Do we both need lawyers?', a: 'Strongly advisable. Independent counsel for each spouse is the most effective protection against a later challenge, and its absence is one of the first things a court examines.' },
      { q: 'Can a postnup be changed later?', a: 'Yes, by a further written agreement signed by both spouses with the same care as the original — including current disclosure.' },
    ],
    fotos: [F.mujer, F.oficina, F.escritorio],
    cta: 'Create your postnuptial agreement',
  },

  // ═══════════════ DINERO — promesa de compraventa, mejorada ═══════════
  {
    slug: 'promissory-note-template',
    titleTag: 'Free Promissory Note Template',
    metaDescription: 'A written promise to pay, with amount, interest, schedule and default terms. Free template, previewed and signed online.',
    h1: 'Promissory Note',
    grupo: 'money',
    intro: 'A promissory note is the simplest debt instrument there is: one party promises to pay another a definite sum, on stated terms. Its brevity is the point — and also the reason so many are written badly, missing the terms that decide what happens when payment does not arrive.',
    problema: {
      titulo: 'Simple is not the same as vague',
      texto: 'A note that says "I promise to pay $10,000" is simple. It is also silent on when, on whether interest accrues, on what happens if a payment is late, and on whether the holder may demand the whole balance. Each of those silences is resolved later by negotiation or by a court, neither of which the lender controls. Adding four clauses keeps the document short and makes it work.',
    },
    puntos: [
      { titulo: 'A definite sum and a definite time', texto: 'The amount and either a maturity date or a payment schedule. Definiteness is not only good practice — it is part of what makes a note negotiable under the UCC.' },
      { titulo: 'Interest, stated properly', texto: 'The rate, the basis, and whether it accrues before or after default. State usury limits apply, and they vary widely.' },
      { titulo: 'Default and acceleration', texto: 'What counts as default, any cure period, and whether the entire unpaid balance becomes due. Without acceleration a lender must chase each missed instalment separately.' },
      { titulo: 'Secured or unsecured, said plainly', texto: 'If collateral backs the note, it needs identifying and usually a separate security agreement. If nothing does, the note should say so rather than leave it open.' },
    ],
    ley: {
      titulo: 'Negotiability, usury and the signature question',
      texto: 'Article 3 of the Uniform Commercial Code governs negotiable instruments, and a promissory note qualifies where it is an unconditional promise to pay a fixed amount of money, payable on demand or at a definite time, and meets the other requirements of UCC § 3-104. Negotiability matters because a holder in due course takes the instrument free of most defences. Interest is limited by state usury statutes, which differ substantially and in some states carry severe consequences for exceeding them. On signature: the ESIGN Act excludes most of the UCC at 15 U.S.C. § 7003(a)(3), so a note intended to be a negotiable instrument should be executed according to state law rather than assumed to be covered — many states have addressed electronic notes through UETA\'s transferable records provisions, but the requirements are specific.',
    },
    caso: {
      titulo: 'No acceleration clause, twenty-four instalments',
      texto: 'A seller financed part of a small equipment sale with a note payable monthly over two years. The buyer paid four instalments and stopped. The note had no acceleration clause, so the balance did not become due — only each instalment as it came. Legally the seller had to wait for each one to fall due before pursuing it, or negotiate. He negotiated, from a much weaker position than a single sentence in the note would have given him.',
    },
    faq: [
      { q: 'What is the difference between a promissory note and an IOU?', a: 'An IOU acknowledges a debt. A promissory note contains a promise to pay on specified terms, and where it meets UCC § 3-104 it may also be negotiable, which an IOU is not.' },
      { q: 'Does a promissory note need a witness or notary?', a: 'Generally not for validity between the parties. Notarization is sometimes used for evidentiary strength, and is commonly required where the note is secured by real property and the security instrument is recorded.' },
      { q: 'Can a promissory note be signed electronically?', a: 'With care. The ESIGN Act excludes most UCC transactions, so where the note is intended to be a negotiable instrument, the applicable state provisions on transferable records govern. For a straightforward non-negotiable loan, an electronic signature is ordinarily fine.' },
      { q: 'What interest rate is allowed?', a: 'Set by state usury law, and different for commercial and consumer loans. Exceeding the ceiling can void the interest and in some states expose the lender to penalties.' },
    ],
    fotos: [F.escritorio, F.firma, F.hombre],
    cta: 'Create your promissory note free',
  },
  {
    slug: 'purchase-agreement-template',
    titleTag: 'Free Purchase Agreement Template',
    metaDescription: 'Sale of goods, equipment or a business asset: price, delivery, title transfer, warranties and risk of loss. Free and signed online.',
    h1: 'Purchase Agreement',
    grupo: 'money',
    intro: 'A purchase agreement records a sale that is not instantaneous — where payment, delivery and transfer of title happen on different days, and something could go wrong in between. It answers who bears that risk.',
    problema: {
      titulo: 'Risk of loss is the clause nobody reads',
      texto: 'Equipment is sold on Monday, paid for on Wednesday, collected on Friday. It is damaged on Thursday night. Who carries that loss? Most informal sales have never considered the question, and the answer under default rules may not be what either party assumed. One sentence naming the moment risk passes — on payment, on delivery, on collection — removes an argument that would otherwise be settled by whoever is more stubborn.',
    },
    puntos: [
      { titulo: 'What exactly is being sold', texto: 'Identification by make, model, serial number or specification. "The machine" is not a description that survives a dispute.' },
      { titulo: 'Price, payment terms and deposit', texto: 'How much, when, in what instalments, and whether any deposit is refundable and under what conditions.' },
      { titulo: 'Delivery, title and risk', texto: 'Where and when delivery occurs, when title passes, and when risk of loss passes. These three are separate events and need not coincide.' },
      { titulo: 'Warranties, or their exclusion', texto: 'Whether the seller warrants condition or the goods are sold as is. An "as is" sale needs saying explicitly, because implied warranties otherwise apply by default.' },
    ],
    ley: {
      titulo: 'The UCC and implied warranties',
      texto: 'Sales of goods between parties in the United States are governed by Article 2 of the Uniform Commercial Code, adopted in every state, with Louisiana as the notable exception. Article 2 supplies terms the parties leave out — including risk of loss under UCC § 2-509 and the implied warranty of merchantability under UCC § 2-314, which applies automatically where the seller is a merchant in goods of that kind. That warranty can be disclaimed, but § 2-316 sets out how: the disclaimer must mention merchantability and, if written, must be conspicuous. A quietly buried "as is" may not do the work the seller expects. The Statute of Frauds provision at UCC § 2-201 requires a signed writing for sales of goods of $500 or more.',
    },
    caso: {
      titulo: 'Damaged in the four days in between',
      texto: 'A restaurant bought a used commercial oven, paid in full, and arranged collection the following week. Over the weekend a pipe burst in the seller\'s storage unit. Neither the invoice nor the messages said anything about when risk passed or when title transferred. Both parties had insurance, and both insurers took the position that the other side\'s policy responded. It was resolved, slowly, and the resolution cost more than the oven. The uncomfortable part is that neither party was careless by ordinary standards. They had agreed a price, exchanged money and set a date, which is what most equipment sales look like. What they had not done was answer a question that only becomes interesting once something has already gone wrong — and by then it is a negotiation between two people who each have a good reason to believe the loss belongs to the other.',
    },
    faq: [
      { q: 'Does a purchase agreement have to be in writing?', a: 'Under UCC § 2-201 a contract for the sale of goods for $500 or more is generally not enforceable unless there is a signed writing sufficient to indicate a contract was made. Below that threshold an oral agreement can bind, but proving its terms is another matter.' },
      { q: 'What does "as is" actually do?', a: 'It disclaims implied warranties, but only if done properly. UCC § 2-316 requires that a disclaimer of merchantability mention merchantability and, in writing, be conspicuous. A disclaimer in small print among boilerplate may fail.' },
      { q: 'When does title pass?', a: 'Absent agreement, the UCC supplies default rules that turn on delivery. Because those defaults surprise people, naming the moment expressly is the simplest protection available.' },
      { q: 'Is this the right document for buying a business?', a: 'No. A business sale involves liabilities, employees, contracts and often stock rather than assets, and needs a purchase agreement drafted for that. A letter of intent is usually the right starting point.' },
    ],
    fotos: [F.hombre, F.escritorio, F.revisar],
    cta: 'Create your purchase agreement',
  },
  {
    slug: 'independent-contractor-agreement-template',
    titleTag: 'Independent Contractor Agreement',
    metaDescription: 'Scope, payment, IP ownership and classification — the four terms that decide whether a contractor relationship holds. Free template.',
    h1: 'Independent Contractor Agreement',
    grupo: 'money',
    intro: 'Hiring a contractor is simple until the work is delivered late, the invoice is disputed, or someone asks who owns what was built. A contractor agreement settles those three questions before they arise, and a fourth that matters more than any of them: whether this person is genuinely a contractor at all.',
    problema: {
      titulo: 'Calling someone a contractor does not make them one',
      texto: 'Worker classification is determined by the substance of the relationship, not by the label in the agreement. Agencies and courts look at how much control the hiring party exercises, whether the worker has a genuine independent business, and how integral the work is to the operation. Misclassification exposes the hiring party to back taxes, unpaid overtime and penalties. A written agreement helps by documenting the intended relationship — but only if the day-to-day arrangement actually matches what it describes.',
    },
    puntos: [
      { titulo: 'Scope, deliverables and acceptance', texto: 'What is being produced, by when, and what counts as done. Most payment disputes are acceptance disputes wearing a different hat.' },
      { titulo: 'Payment terms with a due date', texto: 'Rate or fixed fee, invoicing schedule, payment window, and any late charge. "Net 30" means little without a stated start point.' },
      { titulo: 'Intellectual property ownership', texto: 'Absent a written assignment, a contractor generally retains copyright in what they create — a fact that surprises most clients. If the work is meant to be owned by the hiring party, the agreement must say so expressly.' },
      { titulo: 'Classification and taxes', texto: 'That the contractor is responsible for their own taxes, provides their own tools, controls their own methods, and is free to work for others. Stating it is not sufficient on its own, but its absence is conspicuous.' },
    ],
    ley: {
      titulo: 'Copyright and the works made for hire trap',
      texto: 'Under the Copyright Act, 17 U.S.C. § 201(b), a work made for hire vests ownership in the employer or commissioning party. But § 101 defines that term narrowly: for an independent contractor, it applies only to nine enumerated categories of commissioned work — such as a contribution to a collective work, a translation, or a supplementary work — and only where the parties expressly agree in a signed written instrument. Most commissioned software, design and content falls outside those categories, which means the correct mechanism is a written assignment of copyright, not a "work made for hire" label. Classification itself is assessed under tests that differ between the IRS, the Fair Labor Standards Act and individual state law, with several states applying a stricter ABC test.',
    },
    caso: {
      titulo: 'Who owns the design files',
      texto: 'A company commissioned a brand identity, paid the invoice in full, and used the logo for two years. When they went to register the trademark, the designer pointed out that the agreement had never assigned copyright in the underlying artwork. He was right. The relationship was good and it was resolved amicably with a short assignment and a modest payment — but the company had spent two years building on an asset it did not own.',
    },
    faq: [
      { q: 'Who owns the work a contractor produces?', a: 'The contractor, by default, absent a signed written assignment. The "work made for hire" doctrine applies to commissioned work only in nine narrow categories under 17 U.S.C. § 101, so most agreements need an express assignment instead.' },
      { q: 'Does an agreement protect me from misclassification claims?', a: 'It helps as evidence of intent, but it does not decide the question. Classification turns on the actual working relationship — control, independence and integration — under tests that vary by agency and state.' },
      { q: 'Should a contractor agreement include a non-compete?', a: 'Restrictions on a genuinely independent contractor are often unenforceable and can undercut the classification argument, since freedom to work for others is a hallmark of independence. Confidentiality and non-solicitation are usually the better tools.' },
      { q: 'What payment terms are reasonable?', a: 'Net 15 to net 30 from a correct invoice is common. What matters most is stating when the clock starts and what happens if it is missed.' },
    ],
    fotos: [F.tech, F.mujer, F.firma],
    cta: 'Create your contractor agreement',
  },
  {
    slug: 'service-agreement-template',
    titleTag: 'Free Service Agreement Template',
    metaDescription: 'Define scope, price, timeline and what happens when things change. Free service contract template, previewed and signed online.',
    h1: 'Service Agreement',
    grupo: 'money',
    intro: 'A service agreement is the contract most small businesses sign most often, and the one most often replaced by an email saying "sounds good." It defines what will be done, for how much, by when — and, critically, what happens when the client asks for something that was not in the original scope.',
    problema: {
      titulo: 'Scope creep is a contract problem, not a personality problem',
      texto: 'Every service provider has a story about the project that grew. It is rarely because the client was unreasonable. It is because the agreement described the work loosely enough that both parties could read it differently, and there was no stated process for handling a change. Without a change mechanism, every new request becomes an awkward negotiation about whether it was "already included" — a conversation that damages the relationship whichever way it goes.',
    },
    puntos: [
      { titulo: 'Scope stated as what is included and what is not', texto: 'The exclusions do more work than the inclusions. Naming what falls outside the engagement is what makes a change request obvious rather than contentious.' },
      { titulo: 'A change order process', texto: 'How additional work is requested, priced and approved before it starts. A single paragraph converts scope creep from a conflict into an administrative step.' },
      { titulo: 'Payment schedule and late terms', texto: 'Deposit, milestones or monthly, with a payment window and a stated consequence for late payment — including the right to suspend work.' },
      { titulo: 'Termination on both sides', texto: 'How either party ends the engagement, with what notice, and what is owed for work completed to that point. Agreements that only allow the client to terminate are common and unbalanced.' },
    ],
    ley: {
      titulo: 'How service contracts are treated',
      texto: 'Contracts for services are governed by state common law rather than by Article 2 of the Uniform Commercial Code, which applies to sales of goods — a distinction that matters for mixed contracts, where courts generally apply the "predominant purpose" test to decide which body of law governs the whole agreement. Most states enforce a written service contract without formalities beyond signature, though some require writing for agreements that cannot be performed within one year under the Statute of Frauds. The signature is covered by the ESIGN Act, 15 U.S.C. § 7001, and by state UETA in 49 states, with New York applying State Technology Law § 304.',
    },
    caso: {
      titulo: 'The project that grew by forty percent',
      texto: 'A consultancy agreed a three-month engagement with a fixed fee and a one-paragraph scope. Over eleven weeks the client added a second workstream, two extra stakeholder groups and a reporting requirement, each time reasonably and each time assuming it was within scope. The consultancy delivered all of it rather than have the conversation. They finished on time, over budget by about forty percent of the fee, and did not take the renewal. Neither side had behaved badly. The agreement simply had no mechanism for what actually happened.',
    },
    faq: [
      { q: 'What is the difference between a service agreement and a statement of work?', a: 'The service agreement sets the legal terms — payment, liability, IP, termination — and often covers an ongoing relationship. A statement of work describes a specific engagement\'s scope and deliverables under it. Small engagements frequently combine both.' },
      { q: 'Should I include a limitation of liability?', a: 'It is standard and usually reasonable, commonly capping liability at fees paid. Enforceability varies by state and certain liabilities cannot be limited, but a cap is a normal commercial term rather than an aggressive one.' },
      { q: 'Can I suspend work for non-payment?', a: 'Only if the agreement says so. Without an express right to suspend, stopping work risks being characterised as your breach rather than a response to theirs.' },
      { q: 'How do I handle expenses?', a: 'State whether expenses are included in the fee or billed separately, whether pre-approval is needed above a threshold, and how they are evidenced. Unstated expenses are a frequent source of invoice disputes.' },
    ],
    fotos: [F.oficina, F.hombre, F.escritorio],
    cta: 'Create your service agreement',
  },
];

/** Índice por slug, para resolver la página desde la ruta. */
export const PAGINA_US_POR_SLUG = new Map(PAGINAS_US.map((p) => [p.slug, p]));

/** Hermanas del mismo grupo, para el enlazado interno.
 *
 *  El grupo importa: enlazar una página de prenupciales con una de bancos no
 *  ayuda a nadie y le dice a Google que el sitio no tiene estructura. */
export function hermanasDe(slug: string, maximo = 3): PaginaUS[] {
  const actual = PAGINA_US_POR_SLUG.get(slug);
  if (!actual) return [];
  const mismas = PAGINAS_US.filter((p) => p.grupo === actual.grupo && p.slug !== slug);
  const otras = PAGINAS_US.filter((p) => p.grupo !== actual.grupo && p.slug !== slug);
  return [...mismas, ...otras].slice(0, maximo);
}
